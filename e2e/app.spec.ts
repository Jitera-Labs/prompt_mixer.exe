describe('Prompt Mixer App', () => {
  it('should launch and render the app', async () => {
    // The app should load and have a visible body
    const body = await $('body');
    await expect(body).toBeExisting();
  });

  it('should have the correct title', async () => {
    const title = await browser.getTitle();
    expect(title).toBe('Prompt Mixer');
  });

  it('should display the main application content', async () => {
    // Wait for React to mount - look for the root element
    const root = await $('#root');
    await expect(root).toBeExisting();

    // The root should have content (React has rendered)
    const html = await root.getHTML();
    expect(html.length).toBeGreaterThan(0);
  });
});
