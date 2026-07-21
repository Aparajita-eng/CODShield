import { Injectable } from "@nestjs/common";
import { RiskPlugin } from "./plugins/risk-plugin.interface";

@Injectable()
export class RiskPluginRegistry {
  private plugins: Map<string, RiskPlugin> = new Map();

  register(plugin: RiskPlugin) {
    this.plugins.set(plugin.name, plugin);
  }

  unregister(name: string) {
    this.plugins.delete(name);
  }

  getPlugins(): RiskPlugin[] {
    return Array.from(this.plugins.values());
  }

  getPlugin(name: string): RiskPlugin | undefined {
    return this.plugins.get(name);
  }
}
