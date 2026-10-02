import { expect, test, type Page } from "@playwright/test";

const SHOTS = process.env["E2E_SCREENSHOTS"];
const shot = async (page: Page, name: string) => {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false });
};

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
  const manifest = (await res.json()) as { name: string; icons: unknown[]; start_url: string };
  expect(manifest.name).toBe("Beyond Notes");
  expect(manifest.start_url).toBe("/boards");
  expect(manifest.icons.length).toBeGreaterThanOrEqual(3);
  expect((await request.get("/serwist/sw.js")).ok()).toBe(true);
});

test.describe("signed-in flows", () => {
  const email = `e2e-${Date.now()}@example.com`;
  const password = "pixel-perfect-42";
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });
  test.afterAll(async () => {
    await page.close();
  });

  test("landing → sign up lands on a seeded board", async () => {
    await page.goto("/");
    await expect(page.getByRole("img", { name: "Beyond Notes" })).toBeVisible({ timeout: 10_000 });
    await shot(page, "01-landing");
    await page.getByRole("link", { name: /PRESS START/ }).click();
    await expect(page).toHaveURL(/\/sign-up/);
    await page.getByLabel(/handle/).fill("e2e");
    await page.getByLabel(/email/).fill(email);
    await page.getByLabel(/password/).fill(password);
    await shot(page, "02-signup");
    await page.getByRole("button", { name: /CREATE ACCOUNT/ }).click();
    await expect(page).toHaveURL(/\/boards\/[0-9a-f-]{36}/, { timeout: 15_000 });
    for (const col of ["Backlog", "To Do", "Doing", "Done"]) {
      await expect(page.getByRole("region", { name: `${col} column` })).toBeVisible();
    }
  });

  test("adds a task inline with natural-language parsing", async () => {
    const todo = page.getByRole("region", { name: "To Do column" });
    await todo.getByRole("button", { name: "+ add task" }).click();
    await todo.getByPlaceholder(/title/).fill("Ship pixel release tomorrow !! #launch");
    await todo.getByPlaceholder(/title/).press("Enter");
    const card = todo.getByRole("button", { name: "Ship pixel release" });
    await expect(card).toBeVisible();
    await expect(card).toContainText("#launch");
    await expect(card).toContainText("tomorrow");
    await shot(page, "03-board");
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

  test("opens task details, adds a subtask", async () => {
    await page.getByRole("button", { name: "Ship pixel release" }).click();
    await expect(page).toHaveURL(/\?task=/);
    const dialog = page.getByRole("dialog");
    await dialog.getByPlaceholder("+ add subtask ↵").fill("write changelog");
    await dialog.getByPlaceholder("+ add subtask ↵").press("Enter");
    await expect(dialog.getByText("write changelog")).toBeVisible();
    await shot(page, "04-task-detail");
    await page.keyboard.press("Escape");
    await expect(page).not.toHaveURL(/\?task=/);
    await expect(page.locator("dialog[open]")).toHaveCount(0);
  });

  test("quick capture via keyboard shortcut", async () => {
    await page.keyboard.press("t");
    const input = page.getByLabel("What needs doing?");
    await expect(input).toBeVisible();
    await input.fill("call the printer friday 3pm urgent #ops");
    await expect(page.getByRole("dialog")).toContainText("urgent");
    await shot(page, "05-quick-capture");
    await input.press("Enter");
    await expect(page.getByRole("button", { name: "Call the printer" })).toBeVisible();
    await expect(page.locator("dialog[open]")).toHaveCount(0);
  });

  test("command palette searches notes", async () => {
    await page.keyboard.press("Control+k");
    const box = page.getByPlaceholder("type a command or search…");
    await expect(box).toBeVisible();
    await box.fill("keybo");
    await expect(page.getByRole("option", { name: /README/ })).toBeVisible({ timeout: 10_000 });
    await shot(page, "06-palette");
    await page.keyboard.press("Escape");
    await expect(page.locator("dialog[open]")).toHaveCount(0);
  });

  test("writes a note that autosaves", async () => {
    await page.goto("/notes");
    await page.getByRole("button", { name: "+ new note" }).click();
    await expect(page).toHaveURL(/\/notes\/[0-9a-f-]{36}/);
    await page.getByLabel("Note title").fill("e2e note");
    await page.getByLabel("Note content (Markdown)").fill("# Hello\n\n- [x] pixel\n- [ ] perfect");
    await expect(page.getByLabel("Preview")).toContainText("Hello");
    await page.waitForTimeout(1500);
    await shot(page, "07-note");
    await page.reload();
    await expect(page.getByLabel("Note title")).toHaveValue("e2e note");
  });

  test("calendar, focus and stats render", async () => {
    await page.goto("/calendar");
    await expect(page.getByRole("grid")).toBeVisible();
    await shot(page, "08-calendar");
    await page.goto("/focus");
    await page.getByRole("button", { name: /START/ }).click();
    await expect(page.getByRole("button", { name: /PAUSE/ })).toBeVisible();
    await shot(page, "09-focus");
    await page.getByRole("button", { name: /PAUSE/ }).click();
    await page.goto("/stats");
    await expect(page.getByText("focus heatmap")).toBeVisible();
    await shot(page, "10-stats");
  });

  test("exports data and signs out", async () => {
    const res = await page.request.get("/api/export");
    expect(res.ok()).toBe(true);
    const data = (await res.json()) as { format: string; notes: unknown[] };
    expect(data.format).toBe("beyond-notes/v1");
    expect(data.notes.length).toBeGreaterThanOrEqual(2);
    await page.goto("/boards");
    await page.getByRole("button", { name: "[EXIT]" }).click();
    await expect(page).toHaveURL(/\/$/);
    expect((await page.request.get("/api/v1/boards")).status()).toBe(401);
  });
});
