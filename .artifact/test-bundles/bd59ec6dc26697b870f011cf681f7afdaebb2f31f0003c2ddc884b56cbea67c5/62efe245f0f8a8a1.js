// artifact-test-facade:facade
var facade = globalThis["__artifactPlaywrightTestFacade"];
if (!facade) throw new Error("Artifact test facade is unavailable.");
var devices = facade.devices;
var expect = facade.expect;
var test = facade.test;
var facade_default = facade.test;

// ai-studio-hub/tests/artifact.spec.js
test("loads without browser or network errors", async ({ page }) => {
  const problems = [];
  const report = (kind, detail) => problems.push(`${kind}: ${detail}`);
  page.on("console", (message) => {
    if (message.type() === "error") {
      report("Console error", message.text());
    }
  });
  page.on("pageerror", (error) => report("Uncaught exception", error.message));
  page.on("requestfailed", (request) => report("Request failed", `${request.method()} ${request.url()}`));
  page.on("response", (response) => {
    if (response.status() >= 400) {
      report("HTTP error", `${response.status()} ${response.url()}`);
    }
  });
  await page.goto("/");
  await expect(page.locator("#root > *").first()).toBeAttached();
  expect(problems).toEqual([]);
});
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiYXJ0aWZhY3QtdGVzdC1mYWNhZGU6ZmFjYWRlIiwgIi4uLy4uLy4uL3Rlc3RzL2FydGlmYWN0LnNwZWMuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIlxuY29uc3QgZmFjYWRlID0gZ2xvYmFsVGhpc1tcIl9fYXJ0aWZhY3RQbGF5d3JpZ2h0VGVzdEZhY2FkZVwiXTtcbmlmICghZmFjYWRlKSB0aHJvdyBuZXcgRXJyb3IoXCJBcnRpZmFjdCB0ZXN0IGZhY2FkZSBpcyB1bmF2YWlsYWJsZS5cIik7XG5leHBvcnQgY29uc3QgZGV2aWNlcyA9IGZhY2FkZS5kZXZpY2VzO1xuZXhwb3J0IGNvbnN0IGV4cGVjdCA9IGZhY2FkZS5leHBlY3Q7XG5leHBvcnQgY29uc3QgdGVzdCA9IGZhY2FkZS50ZXN0O1xuZXhwb3J0IGRlZmF1bHQgZmFjYWRlLnRlc3Q7XG4iLCAiaW1wb3J0IHsgZXhwZWN0LCB0ZXN0IH0gZnJvbSBcIkBwbGF5d3JpZ2h0L3Rlc3RcIjtcblxudGVzdChcImxvYWRzIHdpdGhvdXQgYnJvd3NlciBvciBuZXR3b3JrIGVycm9yc1wiLCBhc3luYyAoeyBwYWdlIH0pID0+IHtcbiAgY29uc3QgcHJvYmxlbXMgPSBbXTtcbiAgY29uc3QgcmVwb3J0ID0gKGtpbmQsIGRldGFpbCkgPT4gcHJvYmxlbXMucHVzaChgJHtraW5kfTogJHtkZXRhaWx9YCk7XG5cbiAgcGFnZS5vbihcImNvbnNvbGVcIiwgKG1lc3NhZ2UpID0+IHtcbiAgICBpZiAobWVzc2FnZS50eXBlKCkgPT09IFwiZXJyb3JcIikge1xuICAgICAgcmVwb3J0KFwiQ29uc29sZSBlcnJvclwiLCBtZXNzYWdlLnRleHQoKSk7XG4gICAgfVxuICB9KTtcbiAgcGFnZS5vbihcInBhZ2VlcnJvclwiLCAoZXJyb3IpID0+IHJlcG9ydChcIlVuY2F1Z2h0IGV4Y2VwdGlvblwiLCBlcnJvci5tZXNzYWdlKSk7XG4gIHBhZ2Uub24oXCJyZXF1ZXN0ZmFpbGVkXCIsIChyZXF1ZXN0KSA9PiByZXBvcnQoXCJSZXF1ZXN0IGZhaWxlZFwiLCBgJHtyZXF1ZXN0Lm1ldGhvZCgpfSAke3JlcXVlc3QudXJsKCl9YCkpO1xuICBwYWdlLm9uKFwicmVzcG9uc2VcIiwgKHJlc3BvbnNlKSA9PiB7XG4gICAgaWYgKHJlc3BvbnNlLnN0YXR1cygpID49IDQwMCkge1xuICAgICAgcmVwb3J0KFwiSFRUUCBlcnJvclwiLCBgJHtyZXNwb25zZS5zdGF0dXMoKX0gJHtyZXNwb25zZS51cmwoKX1gKTtcbiAgICB9XG4gIH0pO1xuXG4gIGF3YWl0IHBhZ2UuZ290byhcIi9cIik7XG4gIGF3YWl0IGV4cGVjdChwYWdlLmxvY2F0b3IoXCIjcm9vdCA+ICpcIikuZmlyc3QoKSkudG9CZUF0dGFjaGVkKCk7XG4gIGV4cGVjdChwcm9ibGVtcykudG9FcXVhbChbXSk7XG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFDQSxJQUFNLFNBQVMsV0FBVyxnQ0FBZ0M7QUFDMUQsSUFBSSxDQUFDLE9BQVEsT0FBTSxJQUFJLE1BQU0sc0NBQXNDO0FBQzVELElBQU0sVUFBVSxPQUFPO0FBQ3ZCLElBQU0sU0FBUyxPQUFPO0FBQ3RCLElBQU0sT0FBTyxPQUFPO0FBQzNCLElBQU8saUJBQVEsT0FBTzs7O0FDSnRCLEtBQUssMkNBQTJDLE9BQU8sRUFBRSxLQUFLLE1BQU07QUFDbEUsUUFBTSxXQUFXLENBQUM7QUFDbEIsUUFBTSxTQUFTLENBQUMsTUFBTSxXQUFXLFNBQVMsS0FBSyxHQUFHLElBQUksS0FBSyxNQUFNLEVBQUU7QUFFbkUsT0FBSyxHQUFHLFdBQVcsQ0FBQyxZQUFZO0FBQzlCLFFBQUksUUFBUSxLQUFLLE1BQU0sU0FBUztBQUM5QixhQUFPLGlCQUFpQixRQUFRLEtBQUssQ0FBQztBQUFBLElBQ3hDO0FBQUEsRUFDRixDQUFDO0FBQ0QsT0FBSyxHQUFHLGFBQWEsQ0FBQyxVQUFVLE9BQU8sc0JBQXNCLE1BQU0sT0FBTyxDQUFDO0FBQzNFLE9BQUssR0FBRyxpQkFBaUIsQ0FBQyxZQUFZLE9BQU8sa0JBQWtCLEdBQUcsUUFBUSxPQUFPLENBQUMsSUFBSSxRQUFRLElBQUksQ0FBQyxFQUFFLENBQUM7QUFDdEcsT0FBSyxHQUFHLFlBQVksQ0FBQyxhQUFhO0FBQ2hDLFFBQUksU0FBUyxPQUFPLEtBQUssS0FBSztBQUM1QixhQUFPLGNBQWMsR0FBRyxTQUFTLE9BQU8sQ0FBQyxJQUFJLFNBQVMsSUFBSSxDQUFDLEVBQUU7QUFBQSxJQUMvRDtBQUFBLEVBQ0YsQ0FBQztBQUVELFFBQU0sS0FBSyxLQUFLLEdBQUc7QUFDbkIsUUFBTSxPQUFPLEtBQUssUUFBUSxXQUFXLEVBQUUsTUFBTSxDQUFDLEVBQUUsYUFBYTtBQUM3RCxTQUFPLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztBQUM3QixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
