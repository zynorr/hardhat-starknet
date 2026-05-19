import "./types";

// Register config + environment hooks
import { registerConfigExtension } from "./hooks/extend-config";
import { registerEnvironmentExtension } from "./hooks/extend-environment";
import { registerNetworkExtension } from "./hooks/extend-network";

// Register tasks
import "./tasks/build";
import "./tasks/deploy";
import "./tasks/call";
import "./tasks/init";

// Register hooks
registerConfigExtension();
registerEnvironmentExtension();
registerNetworkExtension();
