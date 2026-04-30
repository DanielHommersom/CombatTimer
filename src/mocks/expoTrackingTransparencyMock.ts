export const PermissionStatus = {
  GRANTED:    'granted',
  DENIED:     'denied',
  UNDETERMINED: 'undetermined',
};

const grantedResponse = {
  granted:     true,
  status:      PermissionStatus.GRANTED,
  expires:     'never' as const,
  canAskAgain: true,
};

export async function requestTrackingPermissionsAsync() {
  return grantedResponse;
}

export async function getTrackingPermissionsAsync() {
  return grantedResponse;
}

export function getAdvertisingId(): string | null {
  return null;
}

export function isAvailable(): boolean {
  return false;
}

export function useTrackingPermissions() {
  return [grantedResponse, requestTrackingPermissionsAsync] as const;
}

export type PermissionResponse = typeof grantedResponse;
export type PermissionExpiration = 'never' | number;
export type PermissionHookOptions = object;
