import browser from '../browser';
import { EVENT_URL_CHANGE, REQUEST_PACKAGE_INFO_EVENT, RESPONSE_PACKAGE_INFO_EVENT } from '../events-shared';
import advisories from './advisory/index';

const listener = async ({ type, detail }, port) => {
  if (type === REQUEST_PACKAGE_INFO_EVENT) {
    const promises = await advisories(detail);
    Object.entries(promises).forEach(([part, promise]) => {
      promise.then((info) => {
        port.postMessage({
          type: RESPONSE_PACKAGE_INFO_EVENT,
          detail: {
            packageId: detail,
            part,
            info,
          },
        });
      });
    });
  }

  return true;
};

export const listen = () => {
  browser.runtime.onConnect.addListener((port) => {
    port.onMessage.addListener(listener);
  });

  browser.tabs.onUpdated.addListener(function (tabId, changeInfo) {
    if (changeInfo.url) {
      chrome.tabs.sendMessage(tabId, {
        message: EVENT_URL_CHANGE,
        url: changeInfo.url,
      });
    }
  });
};
