# Data Source Management

Use backend configuration to control SaaS data sources. Connectors are stored under the `saas` key of `hermes_backend_config`.

## Add a Connector
1. Open the extension Options page.
2. Enter a new connector name and configure its fields.
3. Save to store the configuration in `chrome.storage`.
4. The extension reloads connector mappings immediately.

See [`sample-connector.json`](./sample-connector.json) for the JSON structure.

## Remove a Connector
1. Open the Options page.
2. Use the **Remove** button next to the connector.
3. Save the changes. The connector and its mapping are removed at runtime.

## Update Mapping Files
Connector mappings translate profile fields to API fields.

1. Edit the `mapping` object for a connector in the Options page or in a JSON file.
2. Save the configuration. The extension reloads mappings without requiring a restart.

Default connectors are listed in [`default-connectors.json`](./default-connectors.json).
