import browser from '../browser';
import {
  addMessagingEventListener,
  CONTENT_PORT_CONNECTION,
  dispatchEvent,
  EVENT_SETTINGS_CHANGED,
  EVENT_URL_CHANGED,
  READY_EVENT,
  REQUEST_PACKAGE_INFO_EVENT,
  RESPONSE_PACKAGE_INFO_EVENT,
} from '../events-shared';
import * as storage from '../storage';

const sendPackageInfoToWebapp = (info) => dispatchEvent(RESPONSE_PACKAGE_INFO_EVENT, info);
const sendRealodMessageToWebapp = () => dispatchEvent(EVENT_URL_CHANGED, {});

const backgroundConnection = browser.runtime.connect({ name: CONTENT_PORT_CONNECTION });

backgroundConnection.onMessage.addListener((message) => {
  if (message.type === RESPONSE_PACKAGE_INFO_EVENT) {
    sendPackageInfoToWebapp(message.detail);
  }
});

export const sendEventSettingsChangedToWebapp = async () => {
  const settings = await storage.getAllAdvisoriesSettings();
  dispatchEvent(EVENT_SETTINGS_CHANGED, settings);
};

export const fetchPackageInfo = (packageId) => {
  backgroundConnection.postMessage({ type: REQUEST_PACKAGE_INFO_EVENT, detail: packageId });
};

let isWebappReady = false;
export const onScriptLoaded = (timeout = 5000, interval = 100) => {
  return new Promise((resolve, reject) => {
    const started = Date.now();

    const checkIsWebappReady = () => {
      if (isWebappReady) return resolve();

      const duration = Date.now() - started;
      if (duration > timeout) return reject();

      setTimeout(checkIsWebappReady, interval);
    };

    checkIsWebappReady();
  });
};

const detectUrlChange = () => {
  let previousUrl = '';
  const observer = new MutationObserver(function () {
    if (location.href !== previousUrl) {
      previousUrl = location.href;
      sendRealodMessageToWebapp();
    }
  });
  observer.observe(document, { subtree: true, childList: true });
};

export const listen = () => {
  addMessagingEventListener(READY_EVENT, () => {
    console.log('Ready event received from injected script');
    isWebappReady = true;
  });

  detectUrlChange();

  browser.runtime.onMessage.addListener((message) => {
    switch (message.type) {
      case EVENT_SETTINGS_CHANGED:
        sendEventSettingsChangedToWebapp();
        break;
      case EVENT_URL_CHANGED:
        sendRealodMessageToWebapp();
        break;
      default:
        console.log(`unknown message type: ${message.type}`);
        break;
    }
  });
};
