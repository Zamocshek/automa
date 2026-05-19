<template>
  <div class="space-y-2">
    <ui-textarea
      :model-value="data.description"
      placeholder="Description"
      class="w-full"
      @change="updateData({ description: $event })"
    />
    <ui-input
      :model-value="data.bridgeUrl"
      label="Bridge URL"
      class="w-full"
      placeholder="http://127.0.0.1:8765/run"
      @change="updateData({ bridgeUrl: $event })"
    />
    <ui-select
      :model-value="data.mode"
      label="Mode"
      class="w-full"
      @change="updateData({ mode: $event })"
    >
      <option value="build">build</option>
      <option value="verify">verify</option>
    </ui-select>
    <ui-select
      :model-value="data.template"
      label="Template"
      class="w-full"
      @change="updateData({ template: $event })"
    >
      <option value="private-vpn-lab">private-vpn-lab</option>
      <option value="bot-service">bot-service</option>
    </ui-select>
    <ui-input
      :model-value="data.projectName"
      label="Project name"
      class="w-full"
      placeholder="private-vpn-lab-generated"
      @change="updateData({ projectName: $event })"
    />
    <ui-input
      :model-value="data.brandName"
      label="Brand name"
      class="w-full"
      placeholder="GOY VPN"
      @change="updateData({ brandName: $event })"
    />
    <ui-input
      :model-value="data.botUsername"
      label="Bot username"
      class="w-full"
      placeholder="goy_vpn_robot"
      @change="updateData({ botUsername: $event })"
    />
    <ui-input
      :model-value="data.supportUsername"
      label="Support username"
      class="w-full"
      placeholder="@support"
      @change="updateData({ supportUsername: $event })"
    />
    <ui-input
      :model-value="data.domain"
      label="Public domain"
      class="w-full"
      placeholder="vpn.example.com"
      @change="updateData({ domain: $event })"
    />
    <ui-input
      :model-value="data.subscriptionRoutePrefix"
      label="Subscription route prefix"
      class="w-full"
      placeholder="sub"
      @change="updateData({ subscriptionRoutePrefix: $event })"
    />
    <ui-input
      :model-value="data.deviceLimit"
      label="Device limit"
      type="number"
      class="w-full"
      @change="updateData({ deviceLimit: Number($event) })"
    />
    <ui-select
      :model-value="data.runMode"
      label="Run mode"
      class="w-full"
      @change="updateData({ runMode: $event })"
    >
      <option value="polling">polling</option>
      <option value="http">http</option>
      <option value="webhook">webhook</option>
    </ui-select>
    <ui-select
      :model-value="data.deploymentProfile"
      label="Deployment profile"
      class="w-full"
      @change="updateData({ deploymentProfile: $event })"
    >
      <option value="startup">startup</option>
      <option value="production">production</option>
    </ui-select>
    <ui-input
      :model-value="data.httpPort"
      label="HTTP port"
      type="number"
      class="w-full"
      @change="updateData({ httpPort: Number($event) })"
    />
    <ui-input
      :model-value="data.genericEventPath"
      label="Generic event path"
      class="w-full"
      placeholder="/events"
      @change="updateData({ genericEventPath: $event })"
    />
    <ui-input
      :model-value="data.startupEventPath"
      label="Startup event path"
      class="w-full"
      placeholder="/startup"
      @change="updateData({ startupEventPath: $event })"
    />
    <ui-checkbox
      :model-value="data.includeNginx"
      @change="updateData({ includeNginx: $event })"
    >
      Include Nginx config
    </ui-checkbox>
    <ui-checkbox
      :model-value="data.overwrite"
      @change="updateData({ overwrite: $event })"
    >
      Overwrite existing generated project
    </ui-checkbox>
    <ui-input
      :model-value="data.returnPath"
      label="Return path"
      class="w-full"
      placeholder="result.dir"
      @change="updateData({ returnPath: $event })"
    />
    <ui-checkbox
      :model-value="data.assignVariable"
      @change="updateData({ assignVariable: $event })"
    >
      Assign project output to variable
    </ui-checkbox>
    <ui-input
      v-if="data.assignVariable"
      :model-value="data.variableName"
      label="Variable name"
      class="w-full"
      @change="updateData({ variableName: $event })"
    />
  </div>
</template>

<script setup>
const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>
