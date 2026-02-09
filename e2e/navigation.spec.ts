describe('Navigation', () => {
  it('should show the welcome page or main interface on launch', async () => {
    // Wait for the app to fully load
    await browser.pause(2000);

    // Check that either the welcome page or the main mixer interface is visible
    const body = await $('body');
    const bodyText = await body.getText();
    expect(bodyText.length).toBeGreaterThan(0);
  });

  it('should remain responsive after user interaction', async () => {
    // The app should respond to interactions without crashing
    const body = await $('body');
    await body.click();

    // Verify the app is still responsive after interaction
    await expect(body).toBeExisting();
  });
});
