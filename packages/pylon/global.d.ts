declare global {
  interface Window {
    __IS_NATIVE_APP__?: boolean;
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}

export {};
