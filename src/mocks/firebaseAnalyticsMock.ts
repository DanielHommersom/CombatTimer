const analyticsInstance = {
  setAnalyticsCollectionEnabled: (_enabled: boolean) => Promise.resolve(),
  logEvent: (_name: string, _params?: object) => Promise.resolve(),
  logScreenView: (_params: { screen_name: string; screen_class: string }) => Promise.resolve(),
};

export default function analytics() {
  return analyticsInstance;
}
