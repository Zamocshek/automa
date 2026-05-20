<template>
  <div class="space-y-2">
    <BasActionGrid
      title="Android automation"
      description="ADB/Airtest-style blocks: devices, connect, UI tree, selectors, tap, input, swipe, shell, app control and multi-device run."
      :actions="androidPresets"
      :active="data.mode"
      @select="selectPreset"
    />
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
      label="Operation"
      class="w-full"
      @change="updateData({ mode: $event })"
    >
      <option value="devices">ADB devices</option>
      <option value="connect">Connect device</option>
      <option value="state">Device state</option>
      <option value="uiTree">Get UI tree</option>
      <option value="analyze">Analyze UI</option>
      <option value="findElement">Find element</option>
      <option value="waitElement">Wait element</option>
      <option value="elementAt">Inspect at point</option>
      <option value="xpath">XPath search</option>
      <option value="tap">Tap / click</option>
      <option value="longClick">Long click</option>
      <option value="inputText">Input text</option>
      <option value="swipe">Swipe</option>
      <option value="drag">Drag</option>
      <option value="press">Press key</option>
      <option value="wait">Wait</option>
      <option value="shell">ADB shell</option>
      <option value="screenshot">Screenshot</option>
      <option value="notifications">Notifications</option>
      <option value="app">App control</option>
      <option value="packages">Installed packages</option>
      <option value="intent">Intent / deep link</option>
      <option value="proxy">Proxy</option>
      <option value="location">Geo location</option>
      <option value="permissions">Permissions</option>
      <option value="files">Device files</option>
      <option value="screenRecord">Screen record</option>
      <option value="imageFind">Find image</option>
      <option value="pixel">Pixel color</option>
      <option value="deviceProfile">Device profile</option>
      <option value="monkey">Monkey test</option>
      <option value="buildAirtestScript">Build Airtest script</option>
      <option value="parallelRun">Parallel multi-device run</option>
    </ui-select>
    <ui-input
      :model-value="data.adbPath"
      label="ADB path"
      class="w-full"
      placeholder="adb"
      @change="updateData({ adbPath: $event })"
    />
    <div class="grid grid-cols-2 gap-2">
      <ui-input
        :model-value="data.deviceId"
        label="Device serial"
        class="w-full"
        placeholder="emulator-5554"
        @change="updateData({ deviceId: $event })"
      />
      <ui-select
        :model-value="data.connection"
        label="Connection"
        class="w-full"
        @change="updateData({ connection: $event })"
      >
        <option value="auto">auto</option>
        <option value="usb">usb</option>
        <option value="wifi">wifi</option>
      </ui-select>
    </div>
    <ui-input
      v-if="data.mode === 'connect'"
      :model-value="data.host"
      label="WiFi host / serial"
      class="w-full"
      placeholder="192.168.1.3:5555"
      @change="updateData({ host: $event, wifi: String($event).includes('.') })"
    />
    <template v-if="selectorModes.includes(data.mode)">
      <label class="input-label">Selector JSON</label>
      <ui-textarea
        :model-value="data.selectorJson"
        class="w-full font-mono"
        rows="6"
        spellcheck="false"
        placeholder="{&quot;text&quot;:&quot;Login&quot;,&quot;clickable&quot;:true}"
        @change="updateData({ selectorJson: $event })"
      />
    </template>
    <ui-input
      v-if="data.mode === 'xpath'"
      :model-value="data.xpath"
      label="XPath"
      class="w-full"
      placeholder=".//node[@clickable='true']"
      @change="updateData({ xpath: $event })"
    />
    <template v-if="coordinateModes.includes(data.mode)">
      <div class="grid grid-cols-2 gap-2">
        <ui-input :model-value="data.x" label="X" type="number" class="w-full" @change="updateData({ x: Number($event) })" />
        <ui-input :model-value="data.y" label="Y" type="number" class="w-full" @change="updateData({ y: Number($event) })" />
      </div>
    </template>
    <template v-if="swipeModes.includes(data.mode)">
      <div class="grid grid-cols-2 gap-2">
        <ui-input :model-value="data.x1" label="X1" type="number" class="w-full" @change="updateData({ x1: Number($event) })" />
        <ui-input :model-value="data.y1" label="Y1" type="number" class="w-full" @change="updateData({ y1: Number($event) })" />
        <ui-input :model-value="data.x2" label="X2" type="number" class="w-full" @change="updateData({ x2: Number($event) })" />
        <ui-input :model-value="data.y2" label="Y2" type="number" class="w-full" @change="updateData({ y2: Number($event) })" />
      </div>
      <ui-input
        :model-value="data.durationMs"
        label="Duration, ms"
        class="w-full"
        type="number"
        @change="updateData({ durationMs: Number($event) })"
      />
    </template>
    <template v-if="data.mode === 'inputText'">
      <label class="input-label">Text</label>
      <ui-textarea
        :model-value="data.text"
        class="w-full"
        rows="4"
        placeholder="Hello [[user_name]]"
        @change="updateData({ text: $event })"
      />
      <ui-checkbox :model-value="data.clear" @change="updateData({ clear: $event })">
        Clear field before input
      </ui-checkbox>
    </template>
    <ui-input
      v-if="data.mode === 'press'"
      :model-value="data.key"
      label="Key"
      class="w-full"
      placeholder="BACK"
      @change="updateData({ key: $event })"
    />
    <ui-input
      v-if="data.mode === 'wait'"
      :model-value="data.seconds"
      label="Seconds"
      class="w-full"
      type="number"
      @change="updateData({ seconds: Number($event) })"
    />
    <template v-if="data.mode === 'shell'">
      <label class="input-label">ADB shell command</label>
      <ui-textarea
        :model-value="data.shellCommand"
        class="w-full font-mono"
        rows="5"
        spellcheck="false"
        placeholder="getprop ro.build.version.release"
        @change="updateData({ shellCommand: $event })"
      />
      <ui-checkbox :model-value="data.dryRun" @change="updateData({ dryRun: $event })">
        Dry run
      </ui-checkbox>
    </template>
    <template v-if="data.mode === 'proxy'">
      <ui-select :model-value="data.proxyOperation" label="Proxy operation" class="w-full" @change="updateData({ proxyOperation: $event })">
        <option value="set">set</option>
        <option value="clear">clear</option>
        <option value="current">current</option>
      </ui-select>
      <ui-input :model-value="data.proxy" label="Proxy" class="w-full" placeholder="host:port" @change="updateData({ proxy: $event })" />
      <ui-checkbox :model-value="data.dryRun" @change="updateData({ dryRun: $event })">
        Dry run
      </ui-checkbox>
    </template>
    <template v-if="data.mode === 'location'">
      <div class="grid grid-cols-2 gap-2">
        <ui-input :model-value="data.latitude" label="Latitude" type="number" class="w-full" @change="updateData({ latitude: Number($event) })" />
        <ui-input :model-value="data.longitude" label="Longitude" type="number" class="w-full" @change="updateData({ longitude: Number($event) })" />
      </div>
      <ui-checkbox :model-value="data.dryRun" @change="updateData({ dryRun: $event })">
        Dry run
      </ui-checkbox>
    </template>
    <template v-if="data.mode === 'permissions'">
      <ui-select :model-value="data.permissionOperation" label="Permission operation" class="w-full" @change="updateData({ permissionOperation: $event })">
        <option value="list">list</option>
        <option value="grant">grant</option>
        <option value="revoke">revoke</option>
      </ui-select>
      <ui-input :model-value="data.packageName" label="Package" class="w-full" placeholder="com.example.app" @change="updateData({ packageName: $event })" />
      <ui-input :model-value="data.permission" label="Permission" class="w-full" placeholder="android.permission.POST_NOTIFICATIONS" @change="updateData({ permission: $event })" />
      <ui-checkbox :model-value="data.dryRun" @change="updateData({ dryRun: $event })">
        Dry run
      </ui-checkbox>
    </template>
    <template v-if="data.mode === 'files'">
      <ui-select :model-value="data.fileOperation" label="File operation" class="w-full" @change="updateData({ fileOperation: $event })">
        <option value="list">list</option>
        <option value="push">push</option>
        <option value="pull">pull</option>
        <option value="mkdir">mkdir</option>
        <option value="delete">delete</option>
      </ui-select>
      <ui-input :model-value="data.remotePath" label="Remote path" class="w-full" placeholder="/sdcard/Download" @change="updateData({ remotePath: $event })" />
      <ui-input :model-value="data.localPath" label="Local path" class="w-full" placeholder="C:\\file.txt" @change="updateData({ localPath: $event })" />
      <ui-checkbox :model-value="data.dryRun" @change="updateData({ dryRun: $event })">
        Dry run
      </ui-checkbox>
    </template>
    <template v-if="data.mode === 'intent'">
      <ui-input :model-value="data.intentAction" label="Intent action" class="w-full" placeholder="android.intent.action.VIEW" @change="updateData({ intentAction: $event })" />
      <ui-input :model-value="data.dataUri" label="Data URI" class="w-full" placeholder="https://example.com" @change="updateData({ dataUri: $event })" />
      <ui-input :model-value="data.component" label="Component" class="w-full" placeholder="com.app/.MainActivity" @change="updateData({ component: $event })" />
      <label class="input-label">Extras JSON</label>
      <ui-textarea :model-value="data.extrasJson" class="w-full font-mono" rows="4" spellcheck="false" @change="updateData({ extrasJson: $event })" />
      <ui-checkbox :model-value="data.dryRun" @change="updateData({ dryRun: $event })">
        Dry run
      </ui-checkbox>
    </template>
    <template v-if="['imageFind', 'pixel', 'screenRecord', 'monkey', 'packages'].includes(data.mode)">
      <ui-input v-if="data.mode === 'imageFind'" :model-value="data.templatePath" label="Template image path" class="w-full" placeholder="C:\\button.png" @change="updateData({ templatePath: $event })" />
      <ui-input v-if="data.mode === 'imageFind'" :model-value="data.threshold" label="Threshold" type="number" class="w-full" @change="updateData({ threshold: Number($event) })" />
      <ui-input v-if="data.mode === 'pixel'" :model-value="data.color" label="Expected color" class="w-full" placeholder="#FFFFFF" @change="updateData({ color: $event })" />
      <ui-input v-if="data.mode === 'screenRecord'" :model-value="data.scriptName" label="Record name" class="w-full" @change="updateData({ scriptName: $event })" />
      <ui-input v-if="['screenRecord', 'monkey'].includes(data.mode)" :model-value="data.seconds" label="Seconds / timeout" type="number" class="w-full" @change="updateData({ seconds: Number($event) })" />
      <ui-input v-if="data.mode === 'monkey'" :model-value="data.events" label="Events" type="number" class="w-full" @change="updateData({ events: Number($event) })" />
      <ui-input v-if="['monkey', 'packages'].includes(data.mode)" :model-value="data.packageName" label="Package / filter" class="w-full" @change="updateData({ packageName: $event })" />
      <ui-checkbox v-if="['screenRecord', 'monkey'].includes(data.mode)" :model-value="data.dryRun" @change="updateData({ dryRun: $event })">
        Dry run
      </ui-checkbox>
    </template>
    <template v-if="data.mode === 'deviceProfile'">
      <ui-select :model-value="data.profileOperation" label="Profile operation" class="w-full" @change="updateData({ profileOperation: $event })">
        <option value="build">build</option>
        <option value="apply">apply</option>
        <option value="get">get</option>
        <option value="list">list</option>
        <option value="delete">delete</option>
      </ui-select>
      <ui-input :model-value="data.profileName" label="Profile name" class="w-full" @change="updateData({ profileName: $event })" />
      <div class="grid grid-cols-2 gap-2">
        <ui-input :model-value="data.brand" label="Brand" class="w-full" @change="updateData({ brand: $event })" />
        <ui-input :model-value="data.model" label="Model" class="w-full" @change="updateData({ model: $event })" />
      </div>
      <ui-input :model-value="data.imei" label="IMEI spec" class="w-full" @change="updateData({ imei: $event })" />
      <ui-input :model-value="data.phoneNumber" label="Phone spec" class="w-full" @change="updateData({ phoneNumber: $event })" />
      <ui-checkbox :model-value="data.dryRun" @change="updateData({ dryRun: $event })">
        Dry run apply
      </ui-checkbox>
    </template>
    <template v-if="data.mode === 'app'">
      <ui-select :model-value="data.appOperation" label="App operation" class="w-full" @change="updateData({ appOperation: $event })">
        <option value="current">current</option>
        <option value="start">start</option>
        <option value="stop">stop</option>
        <option value="clear">clear data</option>
        <option value="install">install apk</option>
        <option value="uninstall">uninstall</option>
      </ui-select>
      <ui-input :model-value="data.packageName" label="Package" class="w-full" placeholder="com.example.app" @change="updateData({ packageName: $event })" />
      <ui-input :model-value="data.activity" label="Activity" class="w-full" placeholder=".MainActivity" @change="updateData({ activity: $event })" />
      <ui-input :model-value="data.apkPath" label="APK path" class="w-full" placeholder="C:\\app.apk" @change="updateData({ apkPath: $event })" />
    </template>
    <template v-if="data.mode === 'buildAirtestScript'">
      <ui-input :model-value="data.scriptName" label="Script name" class="w-full" @change="updateData({ scriptName: $event })" />
      <label class="input-label">Airtest steps JSON</label>
      <ui-textarea
        :model-value="data.stepsJson"
        class="w-full font-mono"
        rows="8"
        spellcheck="false"
        @change="updateData({ stepsJson: $event })"
      />
    </template>
    <template v-if="data.mode === 'parallelRun'">
      <label class="input-label">Devices JSON</label>
      <ui-textarea :model-value="data.devicesJson" class="w-full font-mono" rows="4" spellcheck="false" @change="updateData({ devicesJson: $event })" />
      <label class="input-label">Tasks JSON</label>
      <ui-textarea :model-value="data.tasksJson" class="w-full font-mono" rows="8" spellcheck="false" @change="updateData({ tasksJson: $event })" />
      <ui-input :model-value="data.workers" label="Workers" type="number" class="w-full" @change="updateData({ workers: Number($event) })" />
      <ui-checkbox :model-value="data.dryRun" @change="updateData({ dryRun: $event })">
        Dry run plan only
      </ui-checkbox>
    </template>
    <ui-input
      :model-value="data.maxElements"
      label="Max UI elements"
      class="w-full"
      type="number"
      @change="updateData({ maxElements: Number($event) })"
    />
    <ui-checkbox :model-value="data.includeXml" @change="updateData({ includeXml: $event })">
      Include raw UI XML
    </ui-checkbox>
    <ui-input
      :model-value="data.returnPath"
      label="Result path"
      class="w-full"
      placeholder="result"
      @change="updateData({ returnPath: $event })"
    />
    <ui-checkbox :model-value="data.assignVariable" @change="updateData({ assignVariable: $event })">
      Save result to Automa variable
    </ui-checkbox>
    <ui-input
      v-if="data.assignVariable"
      :model-value="data.variableName"
      label="Variable name"
      class="w-full"
      placeholder="android_result"
      @change="updateData({ variableName: $event })"
    />
  </div>
</template>

<script setup>
import BasActionGrid from './BasActionGrid.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const selectorModes = ['findElement', 'waitElement', 'tap', 'longClick', 'inputText'];
const coordinateModes = ['tap', 'longClick', 'inputText', 'elementAt', 'pixel'];
const swipeModes = ['swipe', 'drag'];

const androidPresets = [
  { key: 'devices', label: 'ADB devices', hint: 'scan', values: { mode: 'devices', returnPath: 'result.devices', variableName: 'android_devices' } },
  { key: 'connect', label: 'Connect', hint: 'usb/wifi', values: { mode: 'connect', returnPath: 'result.deviceId', variableName: 'android_device' } },
  { key: 'state', label: 'State', hint: 'screen', values: { mode: 'state', returnPath: 'result', variableName: 'android_state' } },
  { key: 'uiTree', label: 'UI tree', hint: 'xml', values: { mode: 'uiTree', returnPath: 'result.elements', variableName: 'android_tree' } },
  { key: 'analyze', label: 'Analyze', hint: 'labels', values: { mode: 'analyze', returnPath: 'result', variableName: 'android_analysis' } },
  { key: 'findElement', label: 'Get element', hint: 'selector', values: { mode: 'findElement', returnPath: 'result.element', variableName: 'android_element' } },
  { key: 'waitElement', label: 'Wait element', hint: 'presence', values: { mode: 'waitElement', returnPath: 'result.element', variableName: 'android_wait_element' } },
  { key: 'elementAt', label: 'Inspect point', hint: 'cursor', values: { mode: 'elementAt', returnPath: 'result.element', variableName: 'android_point' } },
  { key: 'xpath', label: 'XPath', hint: 'query', values: { mode: 'xpath', xpath: ".//node[@clickable='true']", returnPath: 'result.elements', variableName: 'android_xpath' } },
  { key: 'tap', label: 'Click / tap', hint: 'input', values: { mode: 'tap', returnPath: 'result', variableName: 'android_tap' } },
  { key: 'longClick', label: 'Long click', hint: 'hold', values: { mode: 'longClick', durationMs: 900, returnPath: 'result', variableName: 'android_long_click' } },
  { key: 'inputText', label: 'Input text', hint: 'type', values: { mode: 'inputText', returnPath: 'result', variableName: 'android_input' } },
  { key: 'swipe', label: 'Swipe', hint: 'gesture', values: { mode: 'swipe', returnPath: 'result', variableName: 'android_swipe' } },
  { key: 'drag', label: 'Drag', hint: 'move', values: { mode: 'drag', durationMs: 700, returnPath: 'result', variableName: 'android_drag' } },
  { key: 'press', label: 'Press key', hint: 'back', values: { mode: 'press', key: 'BACK', returnPath: 'result', variableName: 'android_key' } },
  { key: 'wait', label: 'Wait', hint: 'sleep', values: { mode: 'wait', seconds: 1, returnPath: 'result', variableName: 'android_wait' } },
  { key: 'shell', label: 'ADB shell', hint: 'cmd', values: { mode: 'shell', shellCommand: 'getprop ro.build.version.release', returnPath: 'result.stdout', variableName: 'android_shell' } },
  { key: 'screenshot', label: 'Screenshot', hint: 'png', values: { mode: 'screenshot', returnPath: 'result.path', variableName: 'android_screenshot' } },
  { key: 'notifications', label: 'Notifications', hint: 'dumpsys', values: { mode: 'notifications', returnPath: 'result.text', variableName: 'android_notifications' } },
  { key: 'app', label: 'App control', hint: 'apk', values: { mode: 'app', appOperation: 'current', returnPath: 'result', variableName: 'android_app' } },
  { key: 'packages', label: 'Packages', hint: 'pm list', values: { mode: 'packages', returnPath: 'result.packages', variableName: 'android_packages' } },
  { key: 'intent', label: 'Intent', hint: 'deep link', values: { mode: 'intent', dryRun: true, returnPath: 'result', variableName: 'android_intent' } },
  { key: 'proxy', label: 'Proxy', hint: 'network', values: { mode: 'proxy', proxyOperation: 'set', dryRun: true, returnPath: 'result', variableName: 'android_proxy' } },
  { key: 'location', label: 'Geo', hint: 'gps', values: { mode: 'location', dryRun: true, returnPath: 'result', variableName: 'android_location' } },
  { key: 'permissions', label: 'Permissions', hint: 'pm grant', values: { mode: 'permissions', permissionOperation: 'list', dryRun: true, returnPath: 'result', variableName: 'android_permissions' } },
  { key: 'files', label: 'Files', hint: 'push/pull', values: { mode: 'files', fileOperation: 'list', dryRun: true, returnPath: 'result', variableName: 'android_files' } },
  { key: 'screenRecord', label: 'Record', hint: 'mp4', values: { mode: 'screenRecord', dryRun: true, returnPath: 'result.localPath', variableName: 'android_record' } },
  { key: 'imageFind', label: 'Find image', hint: 'cv', values: { mode: 'imageFind', returnPath: 'result.match', variableName: 'android_image' } },
  { key: 'pixel', label: 'Pixel', hint: 'color', values: { mode: 'pixel', returnPath: 'result.hex', variableName: 'android_pixel' } },
  { key: 'deviceProfile', label: 'Profile', hint: 'device', values: { mode: 'deviceProfile', profileOperation: 'build', dryRun: true, returnPath: 'result.profile', variableName: 'android_profile' } },
  { key: 'monkey', label: 'Monkey', hint: 'test', values: { mode: 'monkey', dryRun: true, returnPath: 'result', variableName: 'android_monkey' } },
  { key: 'parallelRun', label: 'Multi-device', hint: 'threads', values: { mode: 'parallelRun', dryRun: true, returnPath: 'result', variableName: 'android_parallel' } },
  { key: 'buildAirtestScript', label: 'Airtest script', hint: '.air', values: { mode: 'buildAirtestScript', returnPath: 'result.script', variableName: 'android_script' } },
];

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}

function selectPreset(action) {
  updateData(action.values || {});
}
</script>
