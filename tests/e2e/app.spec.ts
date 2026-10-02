import { expect, test, type Page } from "@playwright/test";
import { z } from "zod";

const manifestSchema = z.object({
  name: z.string(),
  icons: z.array(z.unknown()),
  start_url: z.string(),
});
const exportSchema = z.object({ format: z.string(), notes: z.array(z.unknown()) });

const SHOTS = process.env["E2E_SCREENSHOTS"];
const shot = async (page: Page, name: string) => {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png` });
};
const noDialogOpen = (page: Page) => expect(page.locator("dialog[open]")).toHaveCount(0);

test.describe.configure({ mode: "serial" });

test("serves security headers and a nonce-based CSP", async ({ request }) => {
  const res = await request.get("/");
  const h = res.headers();
  expect(h["content-security-policy"]).toMatch(
    /script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/,
  );
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["permissions-policy"]).toContain("microphone=(self)");
  expect(h["x-powered-by"]).toBeUndefined();
});

test("protects APIs and the cron endpoint", async ({ request }) => {
  expect((await request.get("/api/v1/boards")).status()).toBe(401);
  expect((await request.get("/api/export")).status()).toBe(401);
  expect((await request.get("/api/cron/reminders")).status()).toBe(401);
  expect(
    (
      await request.get("/api/cron/reminders", { headers: { authorization: "Bearer wrong" } })
    ).status(),
  ).toBe(401);
});

test("redirects anonymous users away from the app", async ({ page }) => {
  await page.goto("/notes");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fnotes/);
});

test("exposes an installable manifest", async ({ request }) => {
  const res = await request.get("/manifest.webmanifest");
  expect(res.ok()).toBe(true);
  const manifest = manifestSchema.parse(await res.json());
  expect(manifest.name).toBe("Beyond");
  expect(manifest.start_url).toBe("/boards");
  expect(manifest.icons.length).toBeGreaterThanOrEqual(3);
  expect((await request.get("/serwist/sw.js")).ok()).toBe(true);
});

test.describe("signed-in flows", () => {
  const email = `e2e-${Date.now()}@example.com`;
  let page: Page;
  const errors: string[] = [];

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    page.on("pageerror", (e) => errors.push(`${page.url()}: ${e.message}`));
  });
  test.afterAll(async () => {
    await page.close();
  });

  test("landing → sign up lands on a seeded board", async () => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "beyond" })).toBeVisible();
    await shot(page, "01-landing");
    await page.getByRole("link", { name: /start for free/ }).click();
    await expect(page).toHaveURL(/\/sign-up/);
    await page.getByLabel("handle").fill("e2e");
    await page.getByLabel("email").fill(email);
    await page.getByLabel("password").fill("pixel-perfect-42");
    await page.getByRole("button", { name: "create account" }).click();
    await expect(page).toHaveURL(/\/boards\/[0-9a-f-]{36}/, { timeout: 15_000 });
    for (const col of ["Backlog", "To Do", "Doing", "Done"]) {
      await expect(page.getByRole("region", { name: `${col} column` })).toBeVisible();
    }
    await expect(page.getByRole("navigation", { name: "Boards" })).toContainText("2");
  });

  test("adds a task inline with natural-language parsing", async () => {
    const todo = page.getByRole("region", { name: "To Do column" });
    await todo.getByRole("button", { name: "add task" }).click();
    const input = todo.getByRole("textbox", { name: "New task in To Do" });
    await input.fill("Ship pixel release tomorrow !!! #launch");
    await input.press("Enter");
    const card = todo.getByRole("button", { name: "Ship pixel release" });
    await expect(card).toBeVisible();
    await expect(card).toContainText("#launch");
    await expect(card).toContainText("tomorrow");
    await expect(card.locator('[aria-label="high priority"]')).toBeVisible();
    await input.press("Escape");
    await shot(page, "02-board");
  });

  test("moves a card with the keyboard and persists it", async () => {
    const card = page
      .getByRole("region", { name: "To Do column" })
      .getByRole("button", { name: "Ship pixel release" });
    await card.focus();
    // Pause between keys like a person would; dnd-kit moves on animation frames.
    await page.keyboard.press("Space");
    await page.waitForTimeout(200);
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(300);
    await page.keyboard.press("Space");
    const doing = page.getByRole("region", { name: "Doing column" });
    await expect(doing.getByRole("button", { name: "Ship pixel release" })).toBeVisible();
    await page.waitForTimeout(800);
    await page.reload();
    await expect(
      page
        .getByRole("region", { name: "Doing column" })
        .getByRole("button", { name: "Ship pixel release" }),
    ).toBeVisible();
  });

  test("opens the task sheet and adds a subtask", async () => {
    await page.getByRole("button", { name: "Ship pixel release" }).click();
    await expect(page).toHaveURL(/\?task=/);
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("textbox", { name: "New subtask" }).fill("write changelog");
    await dialog.getByRole("textbox", { name: "New subtask" }).press("Enter");
    await expect(dialog.getByRole("checkbox", { name: /write changelog/ })).toBeVisible();
    await shot(page, "03-task-sheet");
    await page.keyboard.press("Escape");
    await expect(page).not.toHaveURL(/\?task=/);
    await noDialogOpen(page);
  });

  test("quick capture via keyboard shortcut", async () => {
    await page.keyboard.press("t");
    const input = page.getByLabel("What needs doing?");
    await expect(input).toBeVisible();
    await input.fill("call the printer friday 3pm urgent #ops");
    await expect(page.getByRole("dialog")).toContainText("urgent");
    await shot(page, "04-capture");
    await input.press("Enter");
    await expect(page.getByRole("button", { name: "Call the printer" })).toBeVisible();
    await noDialogOpen(page);
  });

  test("command palette searches notes", async () => {
    await page.keyboard.press("Control+k");
    const box = page.getByPlaceholder("search tasks & notes, or type a command");
    await expect(box).toBeFocused();
    await box.fill("keybo");
    await expect(page.getByRole("option", { name: /README/ })).toBeVisible({ timeout: 10_000 });
    await shot(page, "05-palette");
    await page.keyboard.press("Escape");
    await noDialogOpen(page);
  });

  test("number keys switch windows", async () => {
    await page.keyboard.press("2");
    await expect(page).toHaveURL(/\/notes$/);
    await expect(page.locator("nav[aria-label=Windows] a[aria-current=page]")).toContainText(
      "notes",
    );
    await page.keyboard.press("1");
    await expect(page).toHaveURL(/\/boards/);
  });

  test("writes a note that autosaves", async () => {
    await page.goto("/notes");
    await page.getByRole("button", { name: "new note" }).click();
    await expect(page).toHaveURL(/\/notes\/[0-9a-f-]{36}/);
    await page.getByLabel("Note title").fill("e2e note");
    await page.getByLabel("Note content (Markdown)").fill("# Hello\n\n- [x] pixel\n- [ ] perfect");
    await expect(page.getByRole("region", { name: "Preview" })).toContainText("Hello");
    await page.waitForTimeout(1500);
    await shot(page, "06-note");
    await page.reload();
    await expect(page.getByLabel("Note title")).toHaveValue("e2e note");
  });

  test("focus timer keeps running across windows", async () => {
    await page.goto("/focus");
    await page.getByRole("button", { name: /start/ }).click();
    await expect(page.getByRole("button", { name: /pause/ })).toBeVisible();
    await shot(page, "07-focus");
    await page.keyboard.press("3");
    await expect(page.getByRole("grid")).toBeVisible();
    await expect(page.getByRole("link", { name: /Focus timer running/ })).toBeVisible();
    await shot(page, "08-calendar");
    await page.goto("/focus");
    await page.getByRole("button", { name: /pause/ }).click();
    await page.getByRole("button", { name: /reset/ }).click();
    await page.goto("/stats");
    await expect(page.getByText("focus · 12 weeks")).toBeVisible();
    await shot(page, "09-stats");
  });

  test("exports data and signs out", async () => {
    const res = await page.request.get("/api/export");
    expect(res.ok()).toBe(true);
    const data = exportSchema.parse(await res.json());
    expect(data.format).toBe("beyond-notes/v1");
    expect(data.notes.length).toBeGreaterThanOrEqual(2);
    await page.goto("/settings");
    // The shared galaxy backdrop renders behind the app and can be switched off.
    await expect(page.locator("canvas[aria-hidden]")).toHaveCount(1);
    await page.getByRole("checkbox", { name: "on" }).first().click();
    await expect(page.locator("canvas[aria-hidden]")).toHaveCount(0);
    await shot(page, "10-settings");
    await page.getByRole("button", { name: "sign out" }).click();
    await expect(page).toHaveURL(/\/$/);
    expect((await page.request.get("/api/v1/boards")).status()).toBe(401);
  });

  test("raised no uncaught page errors", () => {
    expect(errors).toEqual([]);
  });
});
