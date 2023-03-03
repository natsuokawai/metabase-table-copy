// You can specify the URL of the page where this extension is displayed in the menu.
// If you do not specify anything (empty string), it will be displayed on all pages.
const METABASE_DOMAIN = "";

chrome.runtime.onInstalled.addListener(updateContextMenus);
chrome.runtime.onStartup.addListener(updateContextMenus);
chrome.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case "context-copy-table":
      copyTableToClipboard(tab);
      break;
  }
});

async function updateContextMenus() {
  await chrome.contextMenus.removeAll();

  const createProperties = {
    id: "context-copy-table",
    title: "Copy Metabase table",
  };
  createProperties.documentUrlPatterns = [
    METABASE_DOMAIN ? `https://${METABASE_DOMAIN}/question/*` : "https://*/*",
  ];

  chrome.contextMenus.create(createProperties);
}

function copyTableToClipboard(tab) {
  async function execute() {
    function createTableText(tableHeader, tableBody) {
      const headerText = `| ${tableHeader.join(" | ")} |`;
      const separator = `| ${Array(tableHeader.length)
        .fill("---")
        .join(" | ")} |`;
      const bodyText = tableBody
        .map((row) => `| ${row.join(" | ")} |`)
        .join("\n");

      return [headerText, separator, bodyText].join("\n");
    }

    function separateArray(array, size) {
      const result = [];
      for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
      }
      return result;
    }

    function extractTableData() {
      const headerClass = "ReactVirtualized__Grid TableInteractive-header";
      const headerCells = document
        .getElementsByClassName(headerClass)[0]
        .getElementsByClassName("cellData");

      const headerValues = [...headerCells].map(
        (el) => el.childNodes[0].textContent
      );

      const bodyId = "main-data-grid";
      const bodyCells = document
        .getElementById(bodyId)
        .getElementsByClassName("cellData");
      const bodyValues = [...bodyCells].map((el) => el.textContent);

      return [headerValues, bodyValues];
    }

    const [headerValues, bodyValues] = extractTableData();
    if (!headerValues || !bodyValues) return;

    const result = createTableText(
      headerValues,
      separateArray(bodyValues, headerValues.length)
    );
    await navigator.clipboard.writeText(result);
    console.log("copied!");
  }

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: execute,
  });
}
