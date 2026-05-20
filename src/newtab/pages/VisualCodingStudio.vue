<template>
  <div class="visual-coding-page">
    <header class="vc-header">
      <div class="vc-brand-row">
        <span class="vc-brand-mark">SB</span>
        <div>
          <p class="vc-kicker">Среда разработки на базе Automa</p>
          <h1>Silverback Coding</h1>
          <p class="vc-subtitle">
            AI-студия workflow для Automa, MCP, Python/Node рантаймов и сборки production-проектов.
          </p>
        </div>
      </div>
      <div class="vc-header-actions">
        <ui-button @click="safeRun(refreshAll)">Обновить</ui-button>
        <ui-button variant="accent" @click="safeRun(runFullDemo)">Запустить полное демо</ui-button>
      </div>
    </header>

    <section class="vc-status-grid">
      <div class="vc-status-card">
        <span class="vc-dot" :class="bridgeState"></span>
        <div>
          <p>Мост</p>
          <strong>{{ bridgeLabel }}</strong>
        </div>
      </div>
      <div class="vc-status-card">
        <span class="vc-dot" :class="mcpState"></span>
        <div>
          <p>MCP-инструменты</p>
          <strong>{{ mcpLabel }}</strong>
        </div>
      </div>
      <div class="vc-status-card">
        <span class="vc-dot" :class="skillState"></span>
        <div>
          <p>Скилл</p>
          <strong>{{ skillLabel }}</strong>
        </div>
      </div>
      <div class="vc-status-card">
        <span class="vc-dot ok"></span>
        <div>
          <p>Студия</p>
          <strong>Рабочее пространство Automa</strong>
        </div>
      </div>
    </section>

    <section class="vc-grid">
      <article class="vc-panel vc-span-2">
        <div class="vc-panel-head">
          <h2>Запуск действий моста</h2>
          <span>/run</span>
        </div>
        <div class="vc-form-grid">
          <ui-select
            :model-value="selectedAction"
            label="Действие"
            block
            @change="selectAction"
          >
            <option
              v-for="action in actions"
              :key="action"
              :value="action"
            >
              {{ action }}
            </option>
          </ui-select>
          <label>
            JSON-параметры
            <ui-textarea
              :model-value="actionPayload"
              spellcheck="false"
              class="vc-code-input"
              @change="actionPayload = $event"
            />
          </label>
        </div>
        <div class="vc-actions">
          <ui-button variant="accent" @click="safeRun(runAction)">Запустить действие</ui-button>
          <ui-button @click="selectAction('echo')">Эхо</ui-button>
          <ui-button @click="selectAction('json_get')">JSON: получить</ui-button>
          <ui-button @click="selectAction('logic_compare')">Логика</ui-button>
          <ui-button @click="selectAction('variable_set')">Переменная</ui-button>
          <ui-button @click="selectAction('loop_range')">Диапазон цикла</ui-button>
          <ui-button @click="selectAction('list_shuffle')">Перемешать список</ui-button>
          <ui-button @click="selectAction('file_write')">Запись файла</ui-button>
          <ui-button @click="selectAction('wait_file')">Ждать файл</ui-button>
          <ui-button @click="selectAction('retry_action')">Повтор</ui-button>
          <ui-button @click="selectAction('build_app')">Payload сборки app</ui-button>
          <ui-button @click="selectAction('python_script_exec')">Python-библиотека</ui-button>
          <ui-button @click="selectAction('node_script_exec')">Node-библиотека</ui-button>
          <ui-button @click="selectAction('telegram_bot_build')">Telegram-бот</ui-button>
          <ui-button @click="selectAction('bot_service_build')">Бот-сервис</ui-button>
          <ui-button @click="selectAction('resource_schema_build')">Поля ресурса</ui-button>
          <ui-button @click="selectAction('parallel_plan_build')">Параллельный план</ui-button>
          <ui-button @click="selectAction('design_app_build')">Дизайн-приложение</ui-button>
          <ui-button @click="selectAction('private_vpn_project_build')">Private VPN</ui-button>
        </div>
      </article>

      <article class="vc-panel vc-span-2">
        <div class="vc-panel-head">
          <h2>Данные и логика</h2>
          <span>JSON + списки + переменные + циклы</span>
        </div>
        <div class="vc-actions">
          <ui-button variant="accent" @click="safeRun(runJsonToolkit)">Ключи JSON</ui-button>
          <ui-button @click="safeRun(runListToolkit)">Убрать дубли</ui-button>
          <ui-button @click="safeRun(runLogicToolkit)">Сравнение</ui-button>
          <ui-button @click="safeRun(runVariableToolkit)">Записать переменную</ui-button>
          <ui-button @click="safeRun(runLoopToolkit)">Диапазон цикла</ui-button>
          <ui-button @click="safeRun(composeDataWorkflow)">Собрать data workflow</ui-button>
        </div>
      </article>

      <article class="vc-panel vc-span-2">
        <div class="vc-panel-head">
          <h2>Блоки из статьи</h2>
          <span>файлы + ожидания + профили + recorder</span>
        </div>
        <div class="vc-actions">
          <ui-button variant="accent" @click="safeRun(runFileToolkit)">Файл: запись/копия</ui-button>
          <ui-button @click="safeRun(runPathToolkit)">Относительный путь</ui-button>
          <ui-button @click="safeRun(runWaitToolkit)">Ждать файл</ui-button>
          <ui-button @click="safeRun(runRetryToolkit)">Повтор HTTP</ui-button>
          <ui-button @click="safeRun(runProfileToolkit)">Метаданные профиля</ui-button>
          <ui-button @click="safeRun(runRecorderToolkit)">Импорт recorder</ui-button>
          <ui-button @click="safeRun(runResultToolkit)">Результат/random</ui-button>
          <ui-button @click="safeRun(composeArticleWorkflow)">Собрать workflow по статье</ui-button>
        </div>
      </article>

      <article class="vc-panel vc-span-2">
        <div class="vc-panel-head">
          <h2>Android / ZennoDroid</h2>
          <span>ADB + UI tree + selector actions + multi-device blocks</span>
        </div>
        <div class="vc-form-grid">
          <div class="vc-stack">
            <ui-input
              :model-value="androidDeviceId"
              label="Device serial"
              placeholder="emulator-5554 или пусто для auto"
              @change="androidDeviceId = $event"
            />
            <ui-input
              :model-value="androidPackageName"
              label="Package"
              placeholder="com.example.app"
              @change="androidPackageName = $event"
            />
            <ui-input
              :model-value="androidText"
              label="Текст для ввода"
              @change="androidText = $event"
            />
            <div class="vc-inline">
              <ui-input
                :model-value="androidX"
                label="X"
                type="number"
                @change="androidX = Number($event)"
              />
              <ui-input
                :model-value="androidY"
                label="Y"
                type="number"
                @change="androidY = Number($event)"
              />
            </div>
          </div>
          <div class="vc-stack">
            <label>
              Selector JSON
              <ui-textarea
                :model-value="androidSelectorJson"
                spellcheck="false"
                class="vc-code-input vc-small-code"
                @change="androidSelectorJson = $event"
              />
            </label>
            <label>
              ADB shell
              <ui-textarea
                :model-value="androidShellCommand"
                spellcheck="false"
                class="vc-code-input vc-small-code"
                @change="androidShellCommand = $event"
              />
            </label>
          </div>
        </div>
        <div class="vc-actions">
          <ui-button variant="accent" @click="safeRun(composeAndroidWorkflow)">Собрать Android workflow</ui-button>
          <ui-button @click="safeRun(runAndroidDevices)">ADB devices</ui-button>
          <ui-button @click="safeRun(runAndroidUiTree)">UI tree</ui-button>
          <ui-button @click="safeRun(runAndroidAnalyze)">Анализ UI</ui-button>
          <ui-button @click="safeRun(runAndroidFindElement)">Найти элемент</ui-button>
          <ui-button @click="safeRun(runAndroidTap)">Tap</ui-button>
          <ui-button @click="safeRun(runAndroidInputText)">Input text</ui-button>
          <ui-button @click="safeRun(runAndroidScreenshot)">Screenshot</ui-button>
          <ui-button @click="safeRun(runAndroidShell)">Shell</ui-button>
          <ui-button @click="selectMcpTool('android.devices')">MCP devices</ui-button>
          <ui-button @click="selectMcpTool('android.tap')">MCP tap</ui-button>
          <ui-button @click="selectMcpTool('android.parallel.run')">MCP multi-device</ui-button>
        </div>
      </article>

      <article class="vc-panel">
        <div class="vc-panel-head">
          <h2>Выполнение Python</h2>
          <span>процессы</span>
        </div>
        <label>
          Код
          <ui-textarea
            :model-value="pythonCode"
            spellcheck="false"
            class="vc-code-input"
            @change="pythonCode = $event"
          />
        </label>
        <label>
          Входной JSON
          <ui-textarea
            :model-value="pythonInput"
            spellcheck="false"
            class="vc-code-input vc-small-code"
            @change="pythonInput = $event"
          />
        </label>
        <ui-button variant="accent" @click="safeRun(runPython)">Запустить Python</ui-button>
      </article>

      <article class="vc-panel">
        <div class="vc-panel-head">
          <h2>Параллельный запуск</h2>
          <span>потоки/процессы</span>
        </div>
        <div class="vc-inline">
          <ui-select
            :model-value="batchMode"
            label="Режим"
            block
            @change="batchMode = $event"
          >
            <option value="thread">потоки</option>
            <option value="process">процессы</option>
          </ui-select>
          <ui-input
            :model-value="batchWorkers"
            label="Воркеры"
            type="number"
            @change="batchWorkers = Number($event)"
          />
          <ui-input
            :model-value="batchRepeats"
            label="Повторы"
            type="number"
            @change="batchRepeats = Number($event)"
          />
        </div>
        <label>
          JSON задач
          <ui-textarea
            :model-value="batchTasks"
            spellcheck="false"
            class="vc-code-input"
            @change="batchTasks = $event"
          />
        </label>
        <ui-button variant="accent" @click="safeRun(runBatch)">Запустить пачку</ui-button>
      </article>

      <article class="vc-panel vc-span-2">
        <div class="vc-panel-head">
          <h2>Сборка приложения</h2>
          <span>внутри UI Automa</span>
        </div>
        <ui-input
          :model-value="appName"
          label="Имя приложения"
          @change="appName = $event"
        />
        <label>
          JSON действий
          <ui-textarea
            :model-value="appActions"
            spellcheck="false"
            class="vc-code-input"
            @change="appActions = $event"
          />
        </label>
        <ui-button variant="accent" @click="safeRun(buildApp)">Сгенерировать приложение</ui-button>
      </article>

      <article class="vc-panel vc-span-2">
        <div class="vc-panel-head">
          <h2>Ресурсы и дизайн</h2>
          <span>поля + воркеры + UI</span>
        </div>
        <div class="vc-form-grid">
          <div class="vc-stack">
            <ui-input
              :model-value="resourceSchemaName"
              label="Имя схемы"
              @change="resourceSchemaName = $event"
            />
            <ui-input
              :model-value="resourceSchemaTitle"
              label="Заголовок схемы"
              @change="resourceSchemaTitle = $event"
            />
            <ui-input
              :model-value="designAppName"
              label="Дизайн-приложение"
              @change="designAppName = $event"
            />
            <ui-input
              :model-value="designAppTitle"
              label="Заголовок приложения"
              @change="designAppTitle = $event"
            />
            <ui-input
              :model-value="parallelPlanName"
              label="Параллельный план"
              @change="parallelPlanName = $event"
            />
          </div>
          <div class="vc-stack">
            <label>
              JSON полей
              <ui-textarea
                :model-value="resourceFieldsJson"
                spellcheck="false"
                class="vc-code-input vc-small-code"
                @change="resourceFieldsJson = $event"
              />
            </label>
            <label>
              JSON значений
              <ui-textarea
                :model-value="resourceValuesJson"
                spellcheck="false"
                class="vc-code-input vc-small-code"
                @change="resourceValuesJson = $event"
              />
            </label>
          </div>
        </div>
        <div class="vc-actions">
          <ui-button variant="accent" @click="safeRun(buildResourceSchema)">Собрать схему полей</ui-button>
          <ui-button @click="safeRun(validateResourceSchema)">Проверить значения</ui-button>
          <ui-button @click="safeRun(buildParallelPlan)">Собрать параллельный план</ui-button>
          <ui-button @click="safeRun(runParallelPlan)">Запустить параллельный план</ui-button>
          <ui-button @click="safeRun(buildDesignAppProject)">Собрать дизайн-приложение</ui-button>
          <ui-button @click="safeRun(verifyDesignAppProject)">Проверить дизайн-приложение</ui-button>
          <ui-button @click="safeRun(composeDesignAppWorkflow)">Собрать design workflow</ui-button>
          <ui-button @click="selectMcpTool('design.app.build')">MCP design app</ui-button>
        </div>
      </article>

      <article class="vc-panel vc-span-2">
        <div class="vc-panel-head">
          <h2>Benchmark-сборщик</h2>
          <span>private-vpn-lab</span>
        </div>
        <div class="vc-form-grid">
          <div class="vc-stack">
            <ui-input
              :model-value="benchmarkProjectName"
              label="Имя проекта"
              @change="benchmarkProjectName = $event"
            />
            <ui-input
              :model-value="benchmarkBrandName"
              label="Бренд"
              @change="benchmarkBrandName = $event"
            />
            <ui-input
              :model-value="benchmarkDomain"
              label="Домен"
              @change="benchmarkDomain = $event"
            />
          </div>
          <div class="vc-stack">
            <ui-input
              :model-value="benchmarkBotUsername"
              label="Username бота"
              @change="benchmarkBotUsername = $event"
            />
            <ui-input
              :model-value="benchmarkSupportUsername"
              label="Поддержка"
              @change="benchmarkSupportUsername = $event"
            />
            <ui-input
              :model-value="benchmarkDeviceLimit"
              label="Лимит устройств"
              type="number"
              @change="benchmarkDeviceLimit = Number($event)"
            />
          </div>
        </div>
        <div class="vc-actions">
          <ui-button variant="accent" @click="safeRun(buildPrivateVpnBenchmark)">Собрать benchmark-проект</ui-button>
          <ui-button @click="safeRun(verifyPrivateVpnBenchmark)">Проверить генерацию</ui-button>
          <ui-button @click="safeRun(buildBotServiceProject)">Собрать бот-сервис</ui-button>
          <ui-button @click="safeRun(verifyBotServiceProject)">Проверить бот-сервис</ui-button>
          <ui-button @click="safeRun(composeBotServiceWorkflow)">Собрать bot workflow</ui-button>
          <ui-button @click="safeRun(composePrivateVpnWorkflow)">Собрать VPN workflow</ui-button>
          <ui-button @click="selectMcpTool('benchmark.private_vpn.build')">MCP-аргументы</ui-button>
          <ui-button @click="selectMcpTool('bots.service.build')">MCP: бот-сервис</ui-button>
        </div>
      </article>

      <article class="vc-panel vc-span-2">
        <div class="vc-panel-head">
          <h2>Python/Node рантайм</h2>
          <span>pip/npm + Telegram</span>
        </div>
        <div class="vc-form-grid">
          <div class="vc-stack">
            <ui-select
              :model-value="libraryRuntime"
              label="Рантайм"
              block
              @change="switchLibraryRuntime"
            >
              <option value="python">python</option>
              <option value="node">node</option>
            </ui-select>
            <label>
              JSON пакетов
              <ui-textarea
                :model-value="libraryPackages"
                spellcheck="false"
                class="vc-code-input vc-small-code"
                @change="libraryPackages = $event"
              />
            </label>
            <label>
              Входной JSON
              <ui-textarea
                :model-value="libraryInput"
                spellcheck="false"
                class="vc-code-input vc-small-code"
                @change="libraryInput = $event"
              />
            </label>
          </div>
          <label>
            Код
            <ui-textarea
              :model-value="libraryCode"
              spellcheck="false"
              class="vc-code-input"
              @change="libraryCode = $event"
            />
          </label>
        </div>
        <div class="vc-actions">
          <ui-button variant="accent" @click="safeRun(runLibraryCode)">Запустить код библиотеки</ui-button>
          <ui-button variant="accent" @click="safeRun(composeTelegramBotWorkflow)">Открыть workflow Telegram-бота</ui-button>
          <ui-button variant="accent" @click="safeRun(composeProductionTelegramServiceWorkflow)">Production bot-service workflow</ui-button>
          <ui-button @click="safeRun(buildTelegramBot)">Bridge scaffold Telegram-бота</ui-button>
          <ui-button @click="safeRun(dryRunTelegramMessage)">Тест Telegram-сообщения</ui-button>
        </div>
        <div class="vc-inline">
          <ui-select
            :model-value="telegramRuntime"
            label="Рантайм бота"
            block
            @change="telegramRuntime = $event"
          >
            <option value="python">python</option>
            <option value="node">node</option>
          </ui-select>
          <ui-input
            :model-value="telegramAppName"
            label="Приложение бота"
            @change="telegramAppName = $event"
          />
          <ui-input
            :model-value="telegramTokenResource"
            label="Ресурс токена"
            @change="telegramTokenResource = $event"
          />
        </div>
        <label>
          JSON обработчиков команд
          <ui-textarea
            :model-value="telegramHandlersJson"
            spellcheck="false"
            class="vc-code-input vc-small-code"
            @change="telegramHandlersJson = $event"
          />
        </label>
      </article>

      <article class="vc-panel vc-span-2">
        <div class="vc-panel-head">
          <h2>Production Control Center</h2>
          <span>release + queues + audit</span>
        </div>
        <section class="vc-metric-grid">
          <div class="vc-mini-card">
            <p>Release</p>
            <strong>{{ productionReadyLabel }}</strong>
          </div>
          <div class="vc-mini-card">
            <p>Sessions</p>
            <strong>{{ dashboardSummary.sessions.total }} total / {{ dashboardSummary.sessions.failed }} failed</strong>
          </div>
          <div class="vc-mini-card">
            <p>Browser jobs</p>
            <strong>{{ dashboardSummary.browserJobs.queued }} queued</strong>
          </div>
          <div class="vc-mini-card">
            <p>Manual gates</p>
            <strong>{{ dashboardSummary.manualInterventions.open }} open</strong>
          </div>
        </section>
        <div class="vc-actions">
          <ui-button variant="accent" @click="safeRun(refreshProductionDashboard)">Refresh dashboard</ui-button>
          <ui-button @click="safeRun(runReleasePreflight)">Release preflight</ui-button>
          <ui-button @click="safeRun(writeReleaseManifest)">Release manifest</ui-button>
          <ui-button @click="safeRun(copyMcpJson)">Copy MCP JSON</ui-button>
          <ui-button @click="safeRun(runProductionSession)">Run sample session</ui-button>
          <ui-button @click="safeRun(enqueueBrowserJob)">Queue browser job</ui-button>
          <ui-button @click="safeRun(runNextBrowserJob)">Run next browser job</ui-button>
          <ui-button @click="safeRun(createManualCheckpoint)">Create manual gate</ui-button>
          <ui-button @click="safeRun(resolveLatestManualCheckpoint)">Resolve latest gate</ui-button>
          <ui-button @click="safeRun(planRecipePermissions)">Plan permissions</ui-button>
        </div>
      </article>

      <article class="vc-panel vc-span-2">
        <div class="vc-panel-head">
          <h2>Project Recipes</h2>
          <span>one-click startup workflows</span>
        </div>
        <div class="vc-recipe-grid">
          <button
            v-for="recipe in projectRecipes"
            :key="recipe.id"
            type="button"
            class="vc-recipe-card"
            :class="{ active: recipe.id === selectedRecipeId }"
            @click="selectProjectRecipe(recipe)"
          >
            <strong>{{ recipe.title || recipe.name }}</strong>
            <span>{{ recipe.summary }}</span>
          </button>
        </div>
        <label>
          Extra requirements for selected recipe
          <ui-textarea
            :model-value="recipeExtraPrompt"
            spellcheck="false"
            class="vc-code-input vc-small-code"
            @change="recipeExtraPrompt = $event"
          />
        </label>
        <div class="vc-actions">
          <ui-button variant="accent" @click="safeRun(buildSelectedRecipeAndOpen)">Build recipe + open editor</ui-button>
          <ui-button @click="safeRun(buildSelectedRecipeArtifact)">Build recipe artifact</ui-button>
          <ui-button @click="loadSelectedRecipeIntoComposer">Load into composer</ui-button>
          <ui-button @click="safeRun(loadProjectRecipes)">Refresh recipes</ui-button>
        </div>
      </article>

      <article class="vc-panel vc-span-2">
        <div class="vc-panel-head">
          <h2>Панель управления MCP</h2>
          <span>/mcp/call</span>
        </div>
        <div class="vc-form-grid">
          <ui-select
            :model-value="selectedMcpTool"
            label="Инструмент"
            block
            @change="selectMcpTool"
          >
            <option
              v-for="tool in mcpTools"
              :key="tool.name"
              :value="tool.name"
            >
              {{ tool.name }}
            </option>
          </ui-select>
          <label>
            JSON аргументов
            <ui-textarea
              :model-value="mcpArgs"
              spellcheck="false"
              class="vc-code-input"
              @change="mcpArgs = $event"
            />
          </label>
        </div>
        <div class="vc-actions">
          <ui-button variant="accent" @click="safeRun(runMcpTool)">Вызвать инструмент</ui-button>
          <ui-button @click="selectMcpTool('bridge.health')">Здоровье моста</ui-button>
          <ui-button @click="selectMcpTool('skill.status')">Статус скилла</ui-button>
          <ui-button @click="selectMcpTool('mcp.server.status')">MCP-сервер</ui-button>
          <ui-button @click="selectMcpTool('mcp.android.server.config')">Android MCP JSON</ui-button>
          <ui-button @click="selectMcpTool('workflow.schedule_patch')">Расписание workflow</ui-button>
          <ui-button @click="selectMcpTool('files.tool')">Файлы</ui-button>
          <ui-button @click="selectMcpTool('wait.tool')">Ожидание</ui-button>
          <ui-button @click="selectMcpTool('network.recorder_import')">Recorder</ui-button>
          <ui-button @click="selectMcpTool('resources.schema.build')">Поля</ui-button>
          <ui-button @click="selectMcpTool('parallel.plan.build')">План</ui-button>
          <ui-button @click="selectMcpTool('design.app.build')">Дизайн-приложение</ui-button>
          <ui-button @click="selectMcpTool('bots.service.build')">Бот-сервис</ui-button>
          <ui-button @click="selectMcpTool('benchmark.private_vpn.build')">VPN benchmark</ui-button>
          <ui-button @click="safeRun(loadPatchTemplate)">Шаблон AI patch</ui-button>
        </div>
      </article>

      <article class="vc-panel vc-span-2">
        <div class="vc-panel-head">
          <h2>AI-композер workflow</h2>
          <span>prompt -> локальный workflow-проект</span>
        </div>
        <label>
          Замысел
          <ui-textarea
            :model-value="composerPrompt"
            spellcheck="false"
            class="vc-code-input vc-small-code"
            @change="composerPrompt = $event"
          />
        </label>
        <div class="vc-actions">
          <ui-button variant="accent" @click="safeRun(composeWorkflow)">
            Создать проект и открыть редактор
          </ui-button>
          <ui-button @click="safeRun(composeWorkflowPatch)">
            Собрать workflow patch
          </ui-button>
          <ui-button @click="composerPrompt = sampleComposerPrompt">
            Пример в стиле BAS
          </ui-button>
        </div>
      </article>

      <article class="vc-panel vc-span-2">
        <div class="vc-panel-head">
          <h2>Утилиты workflow</h2>
          <span>сохранение в Automa</span>
        </div>
        <div class="vc-form-grid">
          <div class="vc-stack">
            <ui-input
              :model-value="utilityName"
              label="Имя workflow"
              @change="utilityName = $event"
            />
            <ui-input
              :model-value="resourceName"
              label="Имя ресурса"
              @change="resourceName = $event"
            />
            <ui-input
              :model-value="resourceType"
              label="Тип ресурса"
              @change="resourceType = $event"
            />
          </div>
          <div class="vc-stack">
            <label>
              Prompt workflow
              <ui-textarea
                :model-value="utilityPrompt"
                spellcheck="false"
                class="vc-code-input vc-small-code"
                @change="utilityPrompt = $event"
              />
            </label>
            <label>
              JSON HTTP-запросов
              <ui-textarea
                :model-value="httpRequestsJson"
                spellcheck="false"
                class="vc-code-input vc-small-code"
                @change="httpRequestsJson = $event"
              />
            </label>
            <label>
              JSON значения ресурса
              <ui-textarea
                :model-value="resourceValue"
                spellcheck="false"
                class="vc-code-input vc-small-code"
                @change="resourceValue = $event"
              />
            </label>
          </div>
        </div>
        <div class="vc-actions">
          <ui-button variant="accent" @click="safeRun(buildUtilityWorkflow)">
            Собрать и открыть проект
          </ui-button>
          <ui-button @click="safeRun(buildUtilityArtifact)">Собрать workflow для импорта</ui-button>
          <ui-button @click="safeRun(buildHttpWorkflow)">Workflow из HTTP-запросов</ui-button>
          <ui-button @click="safeRun(saveResource)">Сохранить ресурс</ui-button>
          <ui-button @click="safeRun(listResources)">Список ресурсов</ui-button>
        </div>
      </article>

      <article class="vc-panel vc-span-2">
        <div class="vc-panel-head">
          <h2>Сканер браузера</h2>
          <span>движок + селекторы</span>
        </div>
        <div class="vc-form-grid">
          <div class="vc-stack">
            <ui-select
              :model-value="browserEngine"
              label="Движок браузера"
              block
              @change="browserEngine = $event"
            >
              <option value="chromium">chromium</option>
              <option value="firefox">firefox</option>
              <option value="webkit">webkit</option>
              <option value="camoufox">camoufox</option>
            </ui-select>
            <ui-input
              :model-value="browserProfileName"
              label="Профиль браузера"
              @change="browserProfileName = $event"
            />
            <ui-input
              :model-value="browserUrl"
              label="URL"
              @change="browserUrl = $event"
            />
            <ui-input
              :model-value="browserSelector"
              label="CSS / XPath селектор"
              @change="browserSelector = $event"
            />
            <ui-input
              :model-value="selectorHint"
              label="Подсказка селектора"
              @change="selectorHint = $event"
            />
          </div>
          <label>
            Inline HTML
            <ui-textarea
              :model-value="browserHtml"
              spellcheck="false"
              class="vc-code-input"
              @change="browserHtml = $event"
            />
          </label>
        </div>
        <div class="vc-actions">
          <ui-button variant="accent" @click="safeRun(scanBrowserUrl)">
            Сканировать URL
          </ui-button>
          <ui-button @click="safeRun(scanBrowserHtml)">Сканировать HTML</ui-button>
          <ui-button @click="safeRun(queryBrowserSelector)">Проверить селектор</ui-button>
          <ui-button @click="safeRun(suggestBrowserSelectors)">Предложить селекторы</ui-button>
          <ui-button @click="safeRun(checkBrowserEngines)">Статус движка</ui-button>
          <ui-button @click="safeRun(createBrowserProfile)">Создать профиль</ui-button>
          <ui-button @click="safeRun(listBrowserProfiles)">Список профилей</ui-button>
        </div>
      </article>
    </section>

    <section class="vc-panel vc-output-panel">
      <div class="vc-panel-head">
        <h2>Вывод</h2>
        <ui-button @click="output = '{}'">Очистить</ui-button>
      </div>
      <pre>{{ output }}</pre>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useWorkflowStore } from '@/stores/workflow';
import { findTriggerBlock } from '@/utils/helper';
import { registerWorkflowTrigger } from '@/utils/workflowTrigger';

const BRIDGE_URL = 'http://127.0.0.1:8765';
const router = useRouter();
const workflowStore = useWorkflowStore();

const bridgeLabel = ref('проверка');
const bridgeState = ref('muted');
const mcpLabel = ref('проверка');
const mcpState = ref('muted');
const skillLabel = ref('проверка');
const skillState = ref('muted');
const actions = ref([]);
const mcpTools = ref([]);
const output = ref('{}');
const productionDashboard = ref(null);
const projectRecipes = ref([]);
const selectedRecipeId = ref('saas-intake-agent');
const recipeExtraPrompt = ref('');
const mcpJsonString = ref('');

const selectedAction = ref('uppercase');
const actionPayload = ref('{}');
const pythonCode = ref('result = input_data["x"] * 2');
const pythonInput = ref('{"x":21}');
const batchMode = ref('thread');
const batchWorkers = ref(2);
const batchRepeats = ref(2);
const batchTasks = ref(`[
  {"action":"uppercase","payload":{"text":"alpha"}},
  {"action":"json_get","payload":{"data":{"user":{"name":"Automa"}},"path":"user.name"}}
]`);
const appName = ref('silverback-coding-automa-demo');
const appActions = ref(`[
  {"action":"echo","payload":{"message":"built from Silverback Coding UI"}},
  {"action":"uppercase","payload":{"text":"automa"}},
  {"action":"logic_compare","payload":{"left":"silverback coding","operator":"contains","right":"coding"}},
  {"action":"list_dedupe","payload":{"items":["alpha","beta","alpha"]}}
]`);
const benchmarkProjectName = ref('silverback-private-vpn-benchmark');
const benchmarkBrandName = ref('Silverback VPN');
const benchmarkBotUsername = ref('goy_vpn_robot');
const benchmarkSupportUsername = ref('@support');
const benchmarkDomain = ref('vpn.example.com');
const benchmarkDeviceLimit = ref(10);
const libraryRuntime = ref('python');
const libraryPackages = ref('[]');
const libraryCode = ref('result = {"triple": input_data["x"] * 3}');
const libraryInput = ref('{"x":14}');
const telegramRuntime = ref('python');
const telegramAppName = ref('silverback-telegram-bot');
const telegramTokenResource = ref('telegram_bot_token');
const telegramHandlersJson = ref(`[
  {"command":"ping","response":"pong"},
  {"command":"status","response":"Silverback Coding bot is alive"}
]`);
const selectedMcpTool = ref('bridge.run_action');
const mcpArgs = ref('{}');
const sampleComposerPrompt = 'Просканируй страницу через Playwright, собери CSS-селекторы, импортируй HTTP-запросы recorder, управляй браузерным профилем с cookies, добавь ожидания и повторы при ошибках, работай с файлами и путями, выполни HTTP API-запрос, собери поля/схему ресурсов, сгенерируй UI-приложение, используй переменные, JSON, списки, логику и циклы, добавь Android automation / ZennoDroid блоки: ADB devices, UI tree, selector tap/input, swipe, screenshot, app/package, proxy, geo, permissions, files, screen record, image/pixel, device profile, Airtest script и multi-device run, запусти Python и Node библиотеки, обработай задачи параллельно через multiprocessing worker plan, собери Telegram bot service с polling, webhook HTTP receiver и Nginx, сгенерируй private VPN Marzban проект, затем собери маленькое приложение.';
const composerPrompt = ref(sampleComposerPrompt);
const browserEngine = ref('chromium');
const browserProfileName = ref('demo-browser-profile');
const browserUrl = ref('https://example.com');
const browserSelector = ref('button, a, input');
const selectorHint = ref('run');
const browserHtml = ref('<main><h1>Демо Silverback Coding</h1><button id="run">Запуск</button><input name="email" placeholder="Email"></main>');
const androidDeviceId = ref('');
const androidPackageName = ref('com.example.app');
const androidText = ref('Hello from Silverback');
const androidX = ref(300);
const androidY = ref(600);
const androidSelectorJson = ref(`{
  "text": "Login",
  "clickable": true
}`);
const androidShellCommand = ref('getprop ro.build.version.release');
const androidWorkflowPrompt = ref('Android automation / ZennoDroid workflow: detect ADB devices, read current app state, dump UI tree, analyze clickable elements, wait for Login selector, tap it, input text, swipe, take screenshot, read notifications, manage app/package, set proxy, set geo, list permissions and files, record screen, check image and pixel, build device profile, run monkey test, build Airtest script, then run a multi-device worker plan.');
const utilityName = ref('silverback-coding-full-utility');
const utilityPrompt = ref('Просканировать страницу Playwright-селекторами, импортировать recorder-запросы, управлять профилями и cookies, ждать и повторять действия, писать файлы и пути, выполнить HTTP-запрос, собрать поля/схему ресурсов, сгенерировать UI-приложение, использовать переменные, JSON, списки, логику и циклы, добавить Android automation / ZennoDroid блоки для ADB devices, UI tree, tap/input, swipe, screenshot, proxy, geo, permissions, files, Airtest и multi-device, запускать Python и Node библиотеки, собрать Telegram bot service с polling, webhook HTTP receiver и Nginx, сгенерировать private VPN Marzban проект, обработать задачи параллельно через worker plan, затем собрать приложение.');
const httpRequestsJson = ref(`[
  {"method":"GET","url":"https://example.com/api","resourceType":"fetch"}
]`);
const resourceName = ref('api_url');
const resourceType = ref('url');
const resourceValue = ref('"https://example.com"');
const resourceSchemaName = ref('startup-intake-fields');
const resourceSchemaTitle = ref('Поля заявки стартапа');
const resourceFieldsJson = ref(`[
  {"name":"api_url","label":"API URL","type":"url","required":true,"default":"https://example.com/api"},
  {"name":"token","label":"Токен","type":"secret","required":false},
  {"name":"workers","label":"Workers","type":"number","default":4,"min":1,"max":32},
  {"name":"mode","label":"Mode","type":"select","default":"startup","options":["startup","production"]},
  {"name":"brand_color","label":"Brand color","type":"color","default":"#7c3aed"}
]`);
const resourceValuesJson = ref(`{
  "api_url": "https://example.com/api",
  "workers": 4,
  "mode": "startup",
  "brand_color": "#7c3aed"
}`);
const designAppName = ref('silverback-designed-app');
const designAppTitle = ref('Silverback Coding Designed App');
const parallelPlanName = ref('silverback-parallel-plan');

const examples = {
  echo: { message: 'from Silverback Coding' },
  uppercase: { text: 'hello silverback coding' },
  string_lowercase: { text: 'HELLO SILVERBACK CODING' },
  string_trim: { text: '  hello silverback coding  ' },
  string_replace: { text: 'hello BAS', old: 'BAS', new: 'Automa' },
  string_split: { text: 'one,two,three', separator: ',' },
  string_join: { items: ['one', 'two', 'three'], separator: ', ' },
  string_regex_match: { text: 'user42 order77', pattern: '\\d+' },
  logic_compare: { left: 'silverback coding', operator: 'contains', right: 'coding' },
  logic_truthy: { value: 'yes' },
  logic_boolean: { operator: 'and', values: [true, 1, 'yes'] },
  logic_choose: { condition: true, whenTrue: 'continue', whenFalse: 'stop' },
  variable_set: { name: 'counter', type: 'number', scope: 'project', value: 1 },
  variable_get: { name: 'counter', default: 0 },
  variable_list: {},
  variable_increment: { name: 'counter', delta: 1 },
  variable_delete: { name: 'counter' },
  loop_range: { start: 0, end: 5, step: 1, inclusive: true },
  loop_repeat: { item: { ok: true }, times: 3 },
  loop_chunk: { items: ['alpha', 'beta', 'gamma'], size: 2 },
  loop_enumerate: { items: ['alpha', 'beta'], start: 1 },
  json_create: { shape: 'object', data: { ok: true } },
  json_get: { data: { user: { name: 'Automa' } }, path: 'user.name' },
  json_set: { data: { user: { name: 'Automa' } }, path: 'user.name', value: 'Silverback Coding' },
  json_delete: { data: { user: { name: 'Automa' }, ok: true }, path: 'ok' },
  json_parse: { text: '{"ok":true}' },
  json_stringify: { data: { ok: true }, indent: 2 },
  json_keys: { data: { user: { name: 'Automa' }, ok: true } },
  json_values: { data: { user: { name: 'Automa' }, ok: true } },
  json_count: { data: { user: { name: 'Automa' }, ok: true } },
  json_is_valid: { text: '{"ok":true}' },
  list_length: { items: ['one', 'two', 'three'] },
  list_create: { items: ['one', 'two'] },
  list_append: { items: ['one', 'two'], item: 'three' },
  list_get: { items: ['one', 'two', 'three'], index: 1 },
  list_first: { items: ['one', 'two', 'three'] },
  list_last: { items: ['one', 'two', 'three'] },
  list_random: { items: ['one', 'two', 'three'] },
  list_insert: { items: ['one', 'three'], index: 1, item: 'two' },
  list_set: { items: ['one', 'old'], index: 1, item: 'two' },
  list_remove: { items: ['one', 'two', 'three'], index: 1 },
  list_contains: { items: ['one', 'two'], item: 'two' },
  list_slice: { items: ['one', 'two', 'three'], start: 1, end: 3 },
  list_remove_range: { items: ['one', 'two', 'three'], start: 1, count: 1 },
  list_join: { items: ['one', 'two', 'three'], separator: ',' },
  list_parse: { text: 'one,two,three', separator: ',' },
  list_index: { items: ['one', 'two'], item: 'two' },
  list_copy: { items: ['one', 'two'] },
  list_sort: { items: ['gamma', 'alpha', 'beta'] },
  list_dedupe: { items: ['alpha', 'beta', 'alpha'] },
  list_shuffle: { items: ['one', 'two', 'three'] },
  list_merge: { lists: [['one'], ['two', 'three']] },
  list_compare: { left: ['one', 'two'], right: ['two', 'one'], mode: 'same_items' },
  list_filter_contains: { items: ['alpha', 'beta', 'gamma'], text: 'a' },
  file_write: { path: 'automa-ui/demo.txt', text: 'created from Silverback Coding' },
  file_read: { path: 'automa-ui/demo.txt' },
  file_exists: { path: 'automa-ui/demo.txt' },
  file_mkdir: { path: 'automa-ui' },
  file_copy: { source: 'automa-ui/demo.txt', target: 'automa-ui/demo-copy.txt' },
  file_move: { source: 'automa-ui/demo-copy.txt', target: 'automa-ui/demo-moved.txt' },
  file_delete: { path: 'automa-ui/demo.txt' },
  path_join: { parts: ['automa-ui', 'demo.txt'] },
  path_basename: { path: 'automa-ui/demo.txt' },
  path_dirname: { path: 'automa-ui/demo.txt' },
  path_ext: { path: 'automa-ui/demo.txt' },
  path_normalize: { path: 'automa-ui/../automa-ui/demo.txt' },
  path_is_absolute: { path: 'automa-ui/demo.txt' },
  path_relative: { path: 'automa-ui/demo.txt', base: 'automa-ui' },
  http_request: { method: 'GET', url: 'https://example.com', maxChars: 4000 },
  wait_sleep: { seconds: 1 },
  wait_file: { path: 'automa-ui/demo.txt', timeout: 5, interval: 0.25 },
  wait_http: { url: 'http://127.0.0.1:8765/health', status: 200, timeout: 5, interval: 0.25 },
  wait_selector: {
    browserEngine: 'chromium',
    html: '<main><h1>Демо Silverback Coding</h1><button id="run">Запуск</button></main>',
    selector: 'button#run',
    state: 'visible',
  },
  wait_text: {
    browserEngine: 'chromium',
    html: '<main><h1>Демо Silverback Coding</h1><button id="run">Запуск</button></main>',
    text: 'Silverback Coding Demo',
    state: 'visible',
  },
  try_action: { action: 'json_get', payload: { data: { ok: true }, path: 'ok' } },
  retry_action: {
    action: 'http_request',
    payload: { url: 'http://127.0.0.1:8765/health', maxChars: 4000 },
    attempts: 2,
    delaySeconds: 0.1,
  },
  random_number: { min: 1, max: 9, integer: true },
  result_log: { level: 'info', message: 'Automa Studio checkpoint', data: { ok: true } },
  result_message: { title: 'Silverback Coding', message: 'Контрольная точка workflow', kind: 'info' },
  python_install_packages: { packages: ['requests'], timeout: 180 },
  python_script_exec: {
    packages: [],
    code: 'import math\nresult = {"sqrt": math.sqrt(input_data["x"])}',
    input: { x: 81 },
    timeout: 10,
  },
  node_install_packages: { packages: ['axios'], timeout: 180 },
  node_script_exec: {
    packages: [],
    code: 'result = { triple: inputData.x * 3 };',
    input: { x: 14 },
    timeout: 10,
  },
  node_app_build: {
    name: 'silverback-node-demo',
    packages: [],
    code: "console.log(JSON.stringify({ ok: true, app: 'silverback-node-demo' }));",
  },
  telegram_send_message: {
    tokenResource: 'telegram_bot_token',
    chatId: '123456',
    text: 'Привет от Silverback Coding',
    dryRun: true,
  },
  telegram_bot_build: {
    runtime: 'python',
    name: 'silverback-telegram-bot',
    tokenResource: 'telegram_bot_token',
    startText: 'Привет, это бот Silverback Coding',
    commandHandlers: [{ command: 'ping', response: 'pong' }],
  },
  bot_service_build: {
    name: 'silverback-bot-service',
    brandName: 'Silverback Bot Service',
    botUsername: 'visual_coding_bot',
    publicDomain: 'bot.example.com',
    deploymentProfile: 'production',
    runMode: 'webhook',
    httpPort: 8082,
    includeNginx: true,
    overwrite: true,
    verify: true,
  },
  bot_service_verify: {
    name: 'silverback-bot-service',
  },
  private_vpn_project_build: {
    name: 'silverback-private-vpn-benchmark',
    brandName: 'GOY VPN',
    botUsername: 'goy_vpn_robot',
    supportUsername: '@support',
    domain: 'vpn.example.com',
    deviceLimit: 10,
    overwrite: true,
    verify: true,
  },
  private_vpn_project_verify: {
    name: 'silverback-private-vpn-benchmark',
  },
  python_exec: { code: 'result = input_data["x"] * 2', input: { x: 21 }, timeout: 5 },
  browser_engine_status: { browserEngine: 'chromium' },
  browser_profile_create: {
    name: 'demo-browser-profile',
    browserEngine: 'chromium',
    description: 'Постоянный профиль для cookies и пользовательских данных',
  },
  browser_profile_list: {},
  browser_profile_delete: { name: 'demo-browser-profile', force: true },
  browser_profile_lock: { name: 'demo-browser-profile', browserEngine: 'chromium', owner: 'studio', ttlSeconds: 300 },
  browser_profile_release: { name: 'demo-browser-profile', token: '<lock-token>' },
  browser_profile_get: { name: 'demo-browser-profile' },
  browser_profile_copy: { source: 'demo-browser-profile', target: 'demo-browser-profile-copy', overwrite: true },
  browser_profile_set_metadata: {
    name: 'demo-browser-profile',
    notes: 'Создано из Automa Studio',
    locale: 'en-US',
    timezoneId: 'UTC',
  },
  browser_profile_import_cookies: { name: 'demo-browser-profile', cookies: [] },
  browser_profile_export_cookies: { name: 'demo-browser-profile' },
  browser_scan_page: {
    browserEngine: 'chromium',
    profileName: 'demo-browser-profile',
    autoCreateProfile: true,
    html: '<main><h1>Демо Silverback Coding</h1><button id="run">Запуск</button><input name="email" placeholder="Email"></main>',
    maxElements: 40,
  },
  browser_query_selector: {
    browserEngine: 'chromium',
    profileName: 'demo-browser-profile',
    autoCreateProfile: true,
    html: '<main><h1>Демо Silverback Coding</h1><button id="run">Запуск</button><input name="email" placeholder="Email"></main>',
    selector: 'button#run',
    limit: 10,
  },
  browser_suggest_selectors: {
    browserEngine: 'chromium',
    profileName: 'demo-browser-profile',
    autoCreateProfile: true,
    html: '<main><h1>Демо Silverback Coding</h1><button id="run">Запуск</button><input name="email" placeholder="Email"></main>',
    hint: 'run',
    maxElements: 40,
  },
  network_capture: {
    browserEngine: 'chromium',
    profileName: 'demo-browser-profile',
    url: 'http://127.0.0.1:8765/health',
    limit: 12,
  },
  network_recorder_import: {
    browserEngine: 'chromium',
    profileName: 'demo-browser-profile',
    url: 'http://127.0.0.1:8765/health',
    name: 'automa-studio-captured-http',
    limit: 12,
  },
  android_adb_devices: { adbPath: 'adb', timeout: 10 },
  android_adb_connect: { adbPath: 'adb', host: '127.0.0.1:5555', wifi: true, timeout: 15 },
  android_state: { adbPath: 'adb', deviceId: '', maxElements: 80 },
  android_ui_tree: { adbPath: 'adb', deviceId: '', includeXml: false, maxElements: 120 },
  android_ui_analyze: { adbPath: 'adb', deviceId: '', maxElements: 120 },
  android_find_element: {
    adbPath: 'adb',
    deviceId: '',
    selector: { text: 'Login', clickable: true },
    maxElements: 120,
  },
  android_wait_element: {
    adbPath: 'adb',
    deviceId: '',
    selector: { text: 'Login', clickable: true },
    timeout: 10,
    interval: 0.5,
  },
  android_element_at: { adbPath: 'adb', deviceId: '', x: 300, y: 600, maxElements: 120 },
  android_xpath: { adbPath: 'adb', deviceId: '', xpath: ".//node[@clickable='true']", limit: 20 },
  android_tap: { adbPath: 'adb', deviceId: '', x: 300, y: 600, selector: { text: 'Login', clickable: true } },
  android_long_click: { adbPath: 'adb', deviceId: '', x: 300, y: 600, durationMs: 900 },
  android_input_text: {
    adbPath: 'adb',
    deviceId: '',
    x: 300,
    y: 600,
    text: 'Hello from Silverback',
    clear: true,
  },
  android_swipe: { adbPath: 'adb', deviceId: '', x1: 300, y1: 900, x2: 300, y2: 300, durationMs: 450 },
  android_drag: { adbPath: 'adb', deviceId: '', x1: 300, y1: 900, x2: 650, y2: 900, durationMs: 700 },
  android_press: { adbPath: 'adb', deviceId: '', key: 'BACK' },
  android_wait: { seconds: 1 },
  android_shell: { adbPath: 'adb', deviceId: '', command: 'getprop ro.build.version.release', dryRun: true },
  android_screenshot: { adbPath: 'adb', deviceId: '', name: 'studio-screenshot' },
  android_notifications: { adbPath: 'adb', deviceId: '', maxChars: 4000 },
  android_app: { adbPath: 'adb', deviceId: '', operation: 'current', packageName: 'com.example.app' },
  android_packages: { adbPath: 'adb', deviceId: '', query: 'com.example' },
  android_intent: {
    adbPath: 'adb',
    deviceId: '',
    intentAction: 'android.intent.action.VIEW',
    dataUri: 'https://example.com',
    dryRun: true,
  },
  android_proxy: { adbPath: 'adb', deviceId: '', operation: 'set', proxy: '127.0.0.1:8080', dryRun: true },
  android_location: { adbPath: 'adb', deviceId: '', latitude: 52.3676, longitude: 4.9041, dryRun: true },
  android_permissions: {
    adbPath: 'adb',
    deviceId: '',
    operation: 'list',
    packageName: 'com.example.app',
    permission: 'android.permission.POST_NOTIFICATIONS',
    dryRun: true,
  },
  android_files: {
    adbPath: 'adb',
    deviceId: '',
    operation: 'list',
    remotePath: '/sdcard/Download',
    localPath: '',
    dryRun: true,
  },
  android_screen_record: { adbPath: 'adb', deviceId: '', name: 'studio-record', seconds: 5, dryRun: true },
  android_image_find: { adbPath: 'adb', deviceId: '', templatePath: 'C:\\button.png', threshold: 0.86 },
  android_pixel: { adbPath: 'adb', deviceId: '', x: 300, y: 600, color: '#FFFFFF' },
  android_device_profile: {
    adbPath: 'adb',
    deviceId: '',
    operation: 'build',
    name: 'silverback-android-profile',
    brand: 'Google',
    model: 'Pixel 7',
    dryRun: true,
  },
  android_monkey: { adbPath: 'adb', deviceId: '', packageName: 'com.example.app', events: 100, dryRun: true },
  android_script_build: {
    name: 'silverback-android-airtest',
    steps: [
      { action: 'tap', x: 300, y: 600 },
      { action: 'text', text: 'Hello from Silverback' },
      { action: 'press', key: 'BACK' },
    ],
  },
  android_parallel_run: {
    devices: [],
    tasks: [{ action: 'android_state', payload: { maxElements: 20 } }],
    workers: 4,
    dryRun: true,
  },
  resource_set: { name: 'api_url', type: 'url', value: 'https://example.com' },
  resource_get: { name: 'api_url' },
  resource_list: {},
  resource_delete: { name: 'api_url' },
  resource_schema_build: {
    name: 'startup-intake-fields',
    title: 'Поля заявки стартапа',
    fields: JSON.parse(resourceFieldsJson.value),
  },
  resource_schema_get: { name: 'startup-intake-fields' },
  resource_schema_list: {},
  resource_schema_validate: {
    name: 'startup-intake-fields',
    values: JSON.parse(resourceValuesJson.value),
  },
  parallel_plan_build: {
    name: 'silverback-parallel-plan',
    mode: 'process',
    workers: 2,
    tasks: [
      { action: 'uppercase', payload: { text: 'one' } },
      { action: 'json_get', payload: { data: { user: { name: 'Automa' } }, path: 'user.name' } },
    ],
  },
  parallel_plan_run: { name: 'silverback-parallel-plan', saveResult: true },
  parallel_plan_list: {},
  design_app_build: {
    name: 'silverback-designed-app',
    title: 'Silverback Coding Designed App',
    schemaName: 'startup-intake-fields',
    fields: JSON.parse(resourceFieldsJson.value),
    overwrite: true,
    verify: true,
  },
  design_app_verify: { name: 'silverback-designed-app' },
  workflow_build_from_prompt: {
    name: 'silverback-coding-full-utility',
    prompt: 'Scan page with Playwright selectors, run Python, process tasks in parallel, then build an app.',
  },
  workflow_from_http_requests: {
    name: 'captured-http-utility',
    requests: [{ method: 'GET', url: 'https://example.com/api', resourceType: 'fetch' }],
  },
  batch: {
    mode: 'thread',
    workers: 2,
    repeats: 2,
    tasks: [
      { action: 'uppercase', payload: { text: 'alpha' } },
      { action: 'json_get', payload: { data: { user: { name: 'Automa' } }, path: 'user.name' } },
    ],
  },
  build_app: {
    name: 'silverback-coding-automa-demo',
    actions: [
      { action: 'echo', payload: { message: 'built from Automa UI' } },
      { action: 'uppercase', payload: { text: 'automa' } },
    ],
  },
};

const mcpExamples = {
  'bridge.health': {},
  'bridge.actions': {},
  'bridge.run_action': { action: 'uppercase', payload: { text: 'mcp call from Automa' } },
  'mcp.server.status': {},
  'mcp.server.config': {},
  'mcp.android.server.config': {},
  'project.status': {},
  'project.read_file': { path: 'memory.md' },
  'skill.status': {},
  'workflow.patch_template': { kind: 'python_bridge' },
  'workflow.compose_from_prompt': { prompt: sampleComposerPrompt },
  'workflow.schedule_patch': { mode: 'on-startup', description: 'Start this service when the browser starts; still keep the normal Execute button.' },
  'browser.engine_status': { browserEngine: 'chromium' },
  'browser.profiles.list': {},
  'browser.profiles.create': {
    name: 'demo-browser-profile',
    browserEngine: 'chromium',
    description: 'Постоянный профиль для cookies и пользовательских данных',
  },
  'browser.profiles.delete': { name: 'demo-browser-profile', force: true },
  'browser.profiles.lock': { name: 'demo-browser-profile', browserEngine: 'chromium', owner: 'studio', ttlSeconds: 300 },
  'browser.profiles.release': { name: 'demo-browser-profile', token: '<lock-token>' },
  'browser.profiles.get': { name: 'demo-browser-profile' },
  'browser.profiles.copy': { source: 'demo-browser-profile', target: 'demo-browser-profile-copy', overwrite: true },
  'browser.profiles.metadata': {
    name: 'demo-browser-profile',
    notes: 'Создано из Automa Studio',
    locale: 'en-US',
    timezoneId: 'UTC',
  },
  'browser.profiles.import_cookies': { name: 'demo-browser-profile', cookies: [] },
  'browser.profiles.export_cookies': { name: 'demo-browser-profile' },
  'browser.scan_page': {
    browserEngine: 'chromium',
    profileName: 'demo-browser-profile',
    autoCreateProfile: true,
    html: '<main><h1>Демо Silverback Coding</h1><button id="run">Запуск</button><input name="email" placeholder="Email"></main>',
    maxElements: 40,
  },
  'browser.query_selector': {
    browserEngine: 'chromium',
    profileName: 'demo-browser-profile',
    autoCreateProfile: true,
    html: '<main><h1>Демо Silverback Coding</h1><button id="run">Запуск</button><input name="email" placeholder="Email"></main>',
    selector: 'button#run',
    limit: 10,
  },
  'browser.suggest_selectors': {
    browserEngine: 'chromium',
    profileName: 'demo-browser-profile',
    autoCreateProfile: true,
    html: '<main><h1>Демо Silverback Coding</h1><button id="run">Запуск</button><input name="email" placeholder="Email"></main>',
    hint: 'run',
    maxElements: 40,
  },
  'http.request': { method: 'GET', url: 'https://example.com', maxChars: 4000 },
  'workflow.build_from_prompt': {
    name: 'silverback-coding-full-utility',
    prompt: 'Scan page with Playwright selectors, save resources, run Python, process tasks in parallel, then build an app.',
  },
  'workflow.from_http_requests': {
    name: 'captured-http-utility',
    requests: [{ method: 'GET', url: 'https://example.com/api', resourceType: 'fetch' }],
  },
  'resources.set': { name: 'api_url', type: 'url', value: 'https://example.com' },
  'resources.get': { name: 'api_url' },
  'resources.list': {},
  'resources.delete': { name: 'api_url' },
  'resources.schema.build': {
    name: 'startup-intake-fields',
    title: 'Поля заявки стартапа',
    fields: JSON.parse(resourceFieldsJson.value),
  },
  'resources.schema.get': { name: 'startup-intake-fields' },
  'resources.schema.list': {},
  'resources.schema.validate': {
    name: 'startup-intake-fields',
    values: JSON.parse(resourceValuesJson.value),
  },
  'parallel.plan.build': {
    name: 'silverback-parallel-plan',
    mode: 'process',
    workers: 2,
    tasks: [
      { action: 'uppercase', payload: { text: 'one' } },
      { action: 'json_get', payload: { data: { user: { name: 'Automa' } }, path: 'user.name' } },
    ],
  },
  'parallel.plan.run': { name: 'silverback-parallel-plan', saveResult: true },
  'parallel.plan.list': {},
  'design.app.build': {
    name: 'silverback-designed-app',
    title: 'Silverback Coding Designed App',
    schemaName: 'startup-intake-fields',
    fields: JSON.parse(resourceFieldsJson.value),
    overwrite: true,
    verify: true,
  },
  'design.app.verify': { name: 'silverback-designed-app' },
  'design.app.capabilities': {},
  'files.tool': { operation: 'write', path: 'automa-ui/demo.txt', text: 'created from MCP files.tool' },
  'paths.tool': { operation: 'relative', path: 'automa-ui/demo.txt', base: 'automa-ui' },
  'json.tool': { operation: 'keys', data: { user: { name: 'Automa' }, ok: true } },
  'lists.tool': { operation: 'dedupe', items: ['alpha', 'beta', 'alpha'] },
  'logic.compare': { left: 'silverback coding', operator: 'contains', right: 'coding' },
  'logic.boolean': { operator: 'and', values: [true, 1, 'yes'] },
  'logic.choose': { condition: true, whenTrue: 'continue', whenFalse: 'stop' },
  'variables.set': { name: 'counter', type: 'number', scope: 'project', value: 1 },
  'variables.get': { name: 'counter', default: 0 },
  'variables.list': {},
  'variables.delete': { name: 'counter' },
  'variables.increment': { name: 'counter', delta: 1 },
  'loops.range': { start: 0, end: 5, step: 1, inclusive: true },
  'loops.repeat': { item: { ok: true }, times: 3 },
  'loops.chunk': { items: ['alpha', 'beta', 'gamma'], size: 2 },
  'loops.enumerate': { items: ['alpha', 'beta'], start: 1 },
  'wait.tool': { operation: 'file', path: 'automa-ui/demo.txt', timeout: 5, interval: 0.25 },
  'runtime.try_action': { action: 'json_get', payload: { data: { ok: true }, path: 'ok' } },
  'runtime.retry_action': {
    action: 'http_request',
    payload: { url: 'http://127.0.0.1:8765/health', maxChars: 4000 },
    attempts: 2,
    delaySeconds: 0.1,
  },
  'network.capture': {
    browserEngine: 'chromium',
    profileName: 'demo-browser-profile',
    url: 'http://127.0.0.1:8765/health',
  },
  'network.recorder_import': {
    browserEngine: 'chromium',
    profileName: 'demo-browser-profile',
    url: 'http://127.0.0.1:8765/health',
    name: 'automa-studio-captured-http',
    limit: 12,
  },
  'android.devices': { adbPath: 'adb', timeout: 10 },
  'android.connect': { adbPath: 'adb', host: '127.0.0.1:5555', wifi: true, timeout: 15 },
  'android.state': { adbPath: 'adb', deviceId: '', maxElements: 80 },
  'android.ui_tree': { adbPath: 'adb', deviceId: '', includeXml: false, maxElements: 120 },
  'android.analyze': { adbPath: 'adb', deviceId: '', maxElements: 120 },
  'android.find_element': { adbPath: 'adb', deviceId: '', selector: { text: 'Login', clickable: true } },
  'android.wait_element': {
    adbPath: 'adb',
    deviceId: '',
    selector: { text: 'Login', clickable: true },
    timeout: 10,
    interval: 0.5,
  },
  'android.element_at': { adbPath: 'adb', deviceId: '', x: 300, y: 600 },
  'android.xpath': { adbPath: 'adb', deviceId: '', xpath: ".//node[@clickable='true']", limit: 20 },
  'android.tap': { adbPath: 'adb', deviceId: '', x: 300, y: 600, selector: { text: 'Login', clickable: true } },
  'android.long_click': { adbPath: 'adb', deviceId: '', x: 300, y: 600, durationMs: 900 },
  'android.input_text': { adbPath: 'adb', deviceId: '', x: 300, y: 600, text: 'Hello from Silverback', clear: true },
  'android.swipe': { adbPath: 'adb', deviceId: '', x1: 300, y1: 900, x2: 300, y2: 300, durationMs: 450 },
  'android.drag': { adbPath: 'adb', deviceId: '', x1: 300, y1: 900, x2: 650, y2: 900, durationMs: 700 },
  'android.press': { adbPath: 'adb', deviceId: '', key: 'BACK' },
  'android.wait': { seconds: 1 },
  'android.shell': { adbPath: 'adb', deviceId: '', command: 'getprop ro.build.version.release', dryRun: true },
  'android.screenshot': { adbPath: 'adb', deviceId: '', name: 'studio-screenshot' },
  'android.notifications': { adbPath: 'adb', deviceId: '', maxChars: 4000 },
  'android.app': { adbPath: 'adb', deviceId: '', operation: 'current', packageName: 'com.example.app' },
  'android.packages': { adbPath: 'adb', deviceId: '', query: 'com.example' },
  'android.intent': {
    adbPath: 'adb',
    deviceId: '',
    intentAction: 'android.intent.action.VIEW',
    dataUri: 'https://example.com',
    dryRun: true,
  },
  'android.proxy': { adbPath: 'adb', deviceId: '', operation: 'set', proxy: '127.0.0.1:8080', dryRun: true },
  'android.location': { adbPath: 'adb', deviceId: '', latitude: 52.3676, longitude: 4.9041, dryRun: true },
  'android.permissions': {
    adbPath: 'adb',
    deviceId: '',
    operation: 'list',
    packageName: 'com.example.app',
    permission: 'android.permission.POST_NOTIFICATIONS',
    dryRun: true,
  },
  'android.files': {
    adbPath: 'adb',
    deviceId: '',
    operation: 'list',
    remotePath: '/sdcard/Download',
    localPath: '',
    dryRun: true,
  },
  'android.screen_record': { adbPath: 'adb', deviceId: '', name: 'studio-record', seconds: 5, dryRun: true },
  'android.image_find': { adbPath: 'adb', deviceId: '', templatePath: 'C:\\button.png', threshold: 0.86 },
  'android.pixel': { adbPath: 'adb', deviceId: '', x: 300, y: 600, color: '#FFFFFF' },
  'android.device_profile': {
    adbPath: 'adb',
    deviceId: '',
    operation: 'build',
    name: 'silverback-android-profile',
    brand: 'Google',
    model: 'Pixel 7',
    dryRun: true,
  },
  'android.monkey': { adbPath: 'adb', deviceId: '', packageName: 'com.example.app', events: 100, dryRun: true },
  'android.script.build': {
    name: 'silverback-android-airtest',
    steps: [
      { action: 'tap', x: 300, y: 600 },
      { action: 'text', text: 'Hello from Silverback' },
      { action: 'press', key: 'BACK' },
    ],
  },
  'android.parallel.run': {
    devices: [],
    tasks: [{ action: 'android_state', payload: { maxElements: 20 } }],
    workers: 4,
    dryRun: true,
  },
  'result.log': { level: 'info', message: 'MCP checkpoint', data: { ok: true } },
  'random.number': { min: 1, max: 9, integer: true },
  'python.install_packages': { packages: ['requests'], timeout: 180 },
  'python.run_script': {
    packages: [],
    code: 'import math\nresult = {"sqrt": math.sqrt(input_data["x"])}',
    input: { x: 81 },
    timeout: 10,
  },
  'node.install_packages': { packages: ['axios'], timeout: 180 },
  'node.run_script': {
    packages: [],
    code: 'result = { triple: inputData.x * 3 };',
    input: { x: 14 },
    timeout: 10,
  },
  'node.build_app': {
    name: 'silverback-node-demo',
    packages: [],
    code: "console.log(JSON.stringify({ ok: true, app: 'silverback-node-demo' }));",
  },
  'telegram.send_message': {
    tokenResource: 'telegram_bot_token',
    chatId: '123456',
    text: 'Привет от Silverback Coding',
    dryRun: true,
  },
  'telegram.build_bot': {
    runtime: 'python',
    name: 'silverback-telegram-bot',
    tokenResource: 'telegram_bot_token',
    startText: 'Привет, это бот Silverback Coding',
    commandHandlers: [{ command: 'ping', response: 'pong' }],
  },
  'bots.service.build': {
    name: 'silverback-bot-service',
    brandName: 'Silverback Bot Service',
    botUsername: 'visual_coding_bot',
    publicDomain: 'bot.example.com',
    deploymentProfile: 'production',
    runMode: 'webhook',
    httpPort: 8082,
    includeNginx: true,
    overwrite: true,
    verify: true,
  },
  'bots.service.verify': {
    name: 'silverback-bot-service',
  },
  'bots.service.capabilities': {},
  'benchmark.private_vpn.build': {
    name: 'silverback-private-vpn-benchmark',
    brandName: 'GOY VPN',
    botUsername: 'goy_vpn_robot',
    supportUsername: '@support',
    domain: 'vpn.example.com',
    deviceLimit: 10,
    overwrite: true,
    verify: true,
  },
  'benchmark.private_vpn.verify': {
    name: 'silverback-private-vpn-benchmark',
  },
  'benchmark.private_vpn.capabilities': {},
  'production.dashboard': { limit: 8, includePreflight: true },
  'project.recipes.list': {},
  'project.recipe.build': {
    id: 'saas-intake-agent',
    projectName: 'silverback-saas-intake-agent',
    extraPrompt: 'Add manual approval before production run.',
  },
  'demo.run': {},
};

const hasBridge = computed(() => bridgeState.value === 'ok');
const dashboardSummary = computed(() => productionDashboard.value?.summary || {
  sessions: { total: 0, failed: 0, blocked: 0, running: 0 },
  browserJobs: { total: 0, queued: 0, running: 0, failed: 0 },
  manualInterventions: { total: 0, open: 0, resolved: 0 },
  permissionAudit: 0,
  packageAudit: 0,
  recipes: projectRecipes.value.length,
});
const productionReadyLabel = computed(() => {
  const ready = productionDashboard.value?.preflight?.ready;
  if (ready === true) return `ready v${productionDashboard.value.version}`;
  if (ready === false) return 'needs attention';
  return 'not checked';
});
const selectedProjectRecipe = computed(
  () => projectRecipes.value.find((recipe) => recipe.id === selectedRecipeId.value) || projectRecipes.value[0] || null,
);

function pretty(value) {
  return JSON.stringify(value, null, 2);
}

function parseJson(value) {
  return JSON.parse(value || '{}');
}

function print(title, data) {
  output.value = `${title}\n${pretty(data)}`;
}

async function getJson(path) {
  const response = await fetch(`${BRIDGE_URL}${path}`);
  const data = await response.json();
  if (!response.ok || data.ok === false) throw new Error(data.error || response.statusText);
  return data;
}

async function postJson(path, body) {
  const response = await fetch(`${BRIDGE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok || data.ok === false) {
    const error = new Error(data.error || response.statusText);
    error.data = data;
    throw error;
  }
  return data;
}

async function callMcp(tool, args = {}) {
  return postJson('/mcp/call', { tool, arguments: args });
}

function selectAction(action) {
  selectedAction.value = action;
  actionPayload.value = pretty(examples[action] || {});
}

function selectMcpTool(tool) {
  selectedMcpTool.value = tool;
  mcpArgs.value = pretty(mcpExamples[tool] || {});
}

async function refreshBridge() {
  try {
    const health = await getJson('/health');
    bridgeLabel.value = `${health.service} ${health.version}`;
    bridgeState.value = 'ok';
    const actionData = await getJson('/actions');
    actions.value = actionData.actions;
    if (!actions.value.includes(selectedAction.value)) selectAction(actions.value[0] || 'echo');
  } catch (error) {
    bridgeLabel.value = error.message;
    bridgeState.value = 'bad';
  }
}

async function refreshMcp() {
  try {
    const data = await getJson('/mcp/tools');
    mcpTools.value = data.tools;
    mcpLabel.value = `${data.tools.length} инструментов`;
    mcpState.value = 'ok';
  } catch (error) {
    mcpLabel.value = error.message;
    mcpState.value = 'bad';
  }
}

async function refreshSkill() {
  try {
    const data = await callMcp('skill.status');
    skillLabel.value = data.installed ? 'установлен' : 'только пакет';
    skillState.value = data.ok ? 'ok' : 'bad';
  } catch (error) {
    skillLabel.value = error.message;
    skillState.value = 'bad';
  }
}

async function refreshAll() {
  await refreshBridge();
  await refreshMcp();
  await refreshSkill();
}

async function runAction() {
  const data = await postJson('/run', {
    action: selectedAction.value,
    payload: parseJson(actionPayload.value),
  });
  print(`Action: ${selectedAction.value}`, data);
}

async function runJsonToolkit() {
  const data = await callMcp('json.tool', {
    operation: 'keys',
    data: { user: { name: 'Automa' }, ok: true },
  });
  print('JSON Toolkit', data);
}

async function runListToolkit() {
  const data = await callMcp('lists.tool', {
    operation: 'dedupe',
    items: ['alpha', 'beta', 'alpha'],
  });
  print('List Toolkit', data);
}

async function runLogicToolkit() {
  const data = await callMcp('logic.compare', {
    left: 'silverback coding',
    operator: 'contains',
    right: 'coding',
  });
  print('Logic Toolkit', data);
}

async function runVariableToolkit() {
  const data = await callMcp('variables.set', {
    name: 'counter',
    type: 'number',
    scope: 'project',
    value: 1,
  });
  print('Variable Toolkit', data);
}

async function runLoopToolkit() {
  const data = await callMcp('loops.range', {
    start: 0,
    end: 5,
    step: 1,
    inclusive: true,
  });
  print('Loop Toolkit', data);
}

async function composeDataWorkflow() {
  const data = await callMcp('workflow.compose_from_prompt', {
    prompt: 'Use variables, JSON, list dedupe, logic if condition and loop range, then run Python and build app.',
  });
  print('Data Workflow Composer', data);
}

async function runFileToolkit() {
  const write = await callMcp('files.tool', {
    operation: 'write',
    path: 'automa-ui/demo.txt',
    text: 'created from Article Block Toolkit',
  });
  const copy = await callMcp('files.tool', {
    operation: 'copy',
    source: 'automa-ui/demo.txt',
    target: 'automa-ui/demo-copy.txt',
  });
  print('File Toolkit', { write, copy });
}

async function runPathToolkit() {
  const data = await callMcp('paths.tool', {
    operation: 'relative',
    path: 'automa-ui/demo-copy.txt',
    base: 'automa-ui',
  });
  print('Path Toolkit', data);
}

async function runWaitToolkit() {
  await callMcp('files.tool', {
    operation: 'write',
    path: 'automa-ui/wait-target.txt',
    text: 'ready',
  });
  const data = await callMcp('wait.tool', {
    operation: 'file',
    path: 'automa-ui/wait-target.txt',
    timeout: 5,
    interval: 0.25,
  });
  print('Wait Toolkit', data);
}

async function runRetryToolkit() {
  const data = await callMcp('runtime.retry_action', {
    action: 'http_request',
    payload: { url: `${BRIDGE_URL}/health`, maxChars: 4000 },
    attempts: 2,
    delaySeconds: 0.1,
  });
  print('Retry Toolkit', data);
}

async function runProfileToolkit() {
  const create = await callMcp('browser.profiles.create', {
    name: browserProfileName.value.trim() || 'demo-browser-profile',
    browserEngine: browserEngine.value,
    description: 'Создано через Article Block Toolkit',
  });
  const metadata = await callMcp('browser.profiles.metadata', {
    name: browserProfileName.value.trim() || 'demo-browser-profile',
    notes: 'Article Block Toolkit profile',
    locale: 'en-US',
    timezoneId: 'UTC',
  });
  const cookies = await callMcp('browser.profiles.import_cookies', {
    name: browserProfileName.value.trim() || 'demo-browser-profile',
    cookies: [],
  });
  print('Инструменты профиля', { create, metadata, cookies });
}

async function runRecorderToolkit() {
  const data = await callMcp('network.recorder_import', {
    name: 'automa-studio-captured-http',
    url: `${BRIDGE_URL}/health`,
    browserEngine: browserEngine.value,
    profileName: browserProfileName.value.trim() || 'demo-browser-profile',
    limit: 12,
  });
  print('Recorder Import Toolkit', data);
}

async function runResultToolkit() {
  const log = await callMcp('result.log', {
    level: 'info',
    message: 'Article toolkit checkpoint',
    data: { ok: true },
  });
  const random = await callMcp('random.number', { min: 1, max: 9, integer: true });
  print('Result Toolkit', { log, random });
}

async function composeArticleWorkflow() {
  const data = await callMcp('workflow.compose_from_prompt', {
    prompt: sampleComposerPrompt,
  });
  print('Article Workflow Composer', data);
}

function androidBasePayload() {
  return {
    adbPath: 'adb',
    deviceId: androidDeviceId.value.trim(),
    packageName: androidPackageName.value.trim(),
    selector: JSON.parse(androidSelectorJson.value || '{}'),
    x: Number(androidX.value || 0),
    y: Number(androidY.value || 0),
    maxElements: 120,
  };
}

async function runAndroidDevices() {
  const data = await callMcp('android.devices', {
    adbPath: 'adb',
    timeout: 10,
  });
  print('Android ADB Devices', data);
}

async function runAndroidUiTree() {
  const data = await callMcp('android.ui_tree', {
    ...androidBasePayload(),
    includeXml: false,
  });
  print('Android UI Tree', data);
}

async function runAndroidAnalyze() {
  const data = await callMcp('android.analyze', androidBasePayload());
  print('Android UI Analyze', data);
}

async function runAndroidFindElement() {
  const data = await callMcp('android.find_element', androidBasePayload());
  print('Android Find Element', data);
}

async function runAndroidTap() {
  const data = await callMcp('android.tap', androidBasePayload());
  print('Android Tap', data);
}

async function runAndroidInputText() {
  const data = await callMcp('android.input_text', {
    ...androidBasePayload(),
    text: androidText.value,
    clear: true,
  });
  print('Android Input Text', data);
}

async function runAndroidScreenshot() {
  const data = await callMcp('android.screenshot', {
    ...androidBasePayload(),
    name: 'studio-screenshot',
  });
  print('Android Screenshot', data);
}

async function runAndroidShell() {
  const data = await callMcp('android.shell', {
    ...androidBasePayload(),
    command: androidShellCommand.value,
    dryRun: true,
  });
  print('Android Shell', data);
}

async function composeAndroidWorkflow() {
  const data = await callMcp('workflow.build_from_prompt', {
    name: 'silverback-android-automation',
    prompt: androidWorkflowPrompt.value,
  });
  await saveWorkflowProject(data.result.workflow, {
    label: 'Android workflow project',
    source: data,
    openEditor: true,
  });
}

async function runPython() {
  const data = await postJson('/run', {
    action: 'python_exec',
    payload: {
      code: pythonCode.value,
      input: parseJson(pythonInput.value),
      timeout: 5,
    },
  });
  print('Python Exec', data);
}

async function runBatch() {
  const data = await postJson('/run', {
    action: 'batch',
    payload: {
      mode: batchMode.value,
      workers: Number(batchWorkers.value),
      repeats: Number(batchRepeats.value),
      tasks: JSON.parse(batchTasks.value),
    },
  });
  print(`Batch: ${batchMode.value}`, data);
}

async function buildApp() {
  const data = await postJson('/run', {
    action: 'build_app',
    payload: {
      name: appName.value,
      actions: JSON.parse(appActions.value),
    },
  });
  print('Build App', data);
}

function resourceSchemaPayload() {
  return {
    name: resourceSchemaName.value,
    title: resourceSchemaTitle.value,
    fields: JSON.parse(resourceFieldsJson.value || '[]'),
    tokens: {
      accent: '#7c3aed',
      success: '#059669',
      warning: '#f59e0b',
      surface: '#f8fafc',
      ink: '#111827',
    },
  };
}

async function buildResourceSchema() {
  const data = await callMcp('resources.schema.build', resourceSchemaPayload());
  print('Resource Field Schema', data);
}

async function validateResourceSchema() {
  const data = await callMcp('resources.schema.validate', {
    name: resourceSchemaName.value,
    values: JSON.parse(resourceValuesJson.value || '{}'),
  });
  print('Resource Values Validation', data);
}

async function buildParallelPlan() {
  const data = await callMcp('parallel.plan.build', {
    name: parallelPlanName.value,
    mode: batchMode.value,
    workers: Number(batchWorkers.value || 2),
    repeats: Number(batchRepeats.value || 1),
    tasks: JSON.parse(batchTasks.value || '[]'),
    resourceSchema: resourceSchemaName.value,
  });
  print('Parallel Plan Build', data);
}

async function runParallelPlan() {
  const data = await callMcp('parallel.plan.run', {
    name: parallelPlanName.value,
    saveResult: true,
  });
  print('Parallel Plan Run', data);
}

async function buildDesignAppProject() {
  const schema = await callMcp('resources.schema.build', resourceSchemaPayload());
  const data = await callMcp('design.app.build', {
    name: designAppName.value,
    title: designAppTitle.value,
    schemaName: resourceSchemaName.value,
    overwrite: true,
    verify: true,
  });
  print('Design App Build', { schema, data });
}

async function verifyDesignAppProject() {
  const data = await callMcp('design.app.verify', {
    name: designAppName.value,
  });
  print('Design App Verify', data);
}

async function composeDesignAppWorkflow() {
  const data = await callMcp('workflow.compose_from_prompt', {
    prompt: 'Build resource fields/schema, validate values, generate a designed UI app, create a reusable parallel worker plan with multiprocessing, then run the batch and save resources.',
  });
  print('Resource Design Workflow Composer', data);
}

function privateVpnPayload() {
  return {
    name: benchmarkProjectName.value,
    brandName: benchmarkBrandName.value,
    botUsername: benchmarkBotUsername.value,
    supportUsername: benchmarkSupportUsername.value,
    domain: benchmarkDomain.value,
    deviceLimit: Number(benchmarkDeviceLimit.value || 10),
    overwrite: true,
    verify: true,
  };
}

async function buildPrivateVpnBenchmark() {
  const data = await callMcp('benchmark.private_vpn.build', privateVpnPayload());
  print('Private VPN Benchmark Build', data);
}

async function verifyPrivateVpnBenchmark() {
  const data = await callMcp('benchmark.private_vpn.verify', {
    name: benchmarkProjectName.value,
  });
  print('Private VPN Benchmark Verify', data);
}

function botServicePayload() {
  return {
    name: 'silverback-bot-service',
    brandName: 'Silverback Bot Service',
    botUsername: benchmarkBotUsername.value || 'visual_coding_bot',
    publicDomain: benchmarkDomain.value || 'bot.example.com',
    deploymentProfile: 'production',
    runMode: 'webhook',
    httpPort: 8082,
    includeNginx: true,
    overwrite: true,
    verify: true,
  };
}

async function buildBotServiceProject() {
  const data = await callMcp('bots.service.build', botServicePayload());
  print('Bot Service Build', data);
}

async function verifyBotServiceProject() {
  const data = await callMcp('bots.service.verify', {
    name: 'silverback-bot-service',
  });
  print('Bot Service Verify', data);
}

async function composeBotServiceWorkflow() {
  const data = await callMcp('workflow.compose_from_prompt', {
    prompt: 'Собери Telegram bot service с polling для стартапа, webhook HTTP receiver для production, Nginx reverse proxy, универсальным POST /events receiver, Docker, systemd и маршрутизацией логики.',
  });
  print('Bot Service Workflow Composer', data);
}

async function composePrivateVpnWorkflow() {
  const data = await callMcp('workflow.compose_from_prompt', {
    prompt: 'Сгенерируй private VPN Marzban VLESS REALITY Telegram bot project как private-vpn-lab с SQLite, платежами, webhooks, кодами активации, Docker, systemd и ops-проверкой.',
  });
  print('Private VPN Workflow Composer', data);
}

function switchLibraryRuntime(runtime) {
  libraryRuntime.value = runtime;
  if (runtime === 'node') {
    libraryCode.value = 'result = { triple: inputData.x * 3 };';
    libraryInput.value = '{"x":14}';
  } else {
    libraryCode.value = 'result = {"triple": input_data["x"] * 3}';
    libraryInput.value = '{"x":14}';
  }
}

async function runLibraryCode() {
  const tool = libraryRuntime.value === 'node' ? 'node.run_script' : 'python.run_script';
  const data = await callMcp(tool, {
    packages: JSON.parse(libraryPackages.value || '[]'),
    code: libraryCode.value,
    input: parseJson(libraryInput.value),
    timeout: 30,
    installTimeout: 180,
  });
  print(`Library Runtime: ${libraryRuntime.value}`, data);
}

async function buildTelegramBot() {
  const data = await callMcp('telegram.build_bot', {
    runtime: telegramRuntime.value,
    name: telegramAppName.value,
    tokenResource: telegramTokenResource.value,
    startText: 'Привет, это бот Silverback Coding',
    commandHandlers: JSON.parse(telegramHandlersJson.value || '[]'),
  });
  print('Telegram Bot Builder', data);
}

async function composeTelegramBotWorkflow() {
  const handlers = JSON.parse(telegramHandlersJson.value || '[]');
  const handlerText = handlers
    .map((handler) => `/${handler.command}: ${handler.response}`)
    .join('; ');
  const data = await callMcp('workflow.build_from_prompt', {
    name: `${telegramAppName.value || 'silverback-telegram-bot'}-workflow`,
    prompt: [
      `Собери Telegram bot workflow как видимый Automa canvas, а не скрытый текстовый код.`,
      `runtime: ${telegramRuntime.value}.`,
      `app name: ${telegramAppName.value || 'silverback-telegram-bot'}.`,
      `token resource: ${telegramTokenResource.value || 'telegram_bot_token'}.`,
      `commands: ${handlerText || '/ping: pong'}.`,
      `Добавь secret/resource block для токена, Telegram Bot Builder block, понятный checkpoint и System Command block, который запускает generated project from workflow через run.ps1.`,
      `Пользователь должен открыть workflow, увидеть блоки, нажать выполнить и получить запуск проекта из workflow.`,
    ].join(' '),
  });
  await saveWorkflowProject(data.result.workflow, {
    label: 'Telegram bot workflow project',
    source: data,
    openEditor: true,
  });
}

async function composeProductionTelegramServiceWorkflow() {
  const handlers = JSON.parse(telegramHandlersJson.value || '[]');
  const handlerText = handlers
    .map((handler) => `/${handler.command}: ${handler.response}`)
    .join('; ');
  const data = await callMcp('workflow.build_from_prompt', {
    name: `${telegramAppName.value || 'silverback-telegram-service'}-production-workflow`,
    prompt: [
      'Build a production Telegram bot service workflow with polling startup, webhook HTTP receiver, Nginx, Docker and systemd files.',
      'The workflow must be visible and editable in Silverback/Automa, not hidden code.',
      `app name: ${telegramAppName.value || 'silverback-telegram-service'}.`,
      `token resource: ${telegramTokenResource.value || 'telegram_bot_token'}.`,
      `commands: ${handlerText || '/start: hello, /ping: pong'}.`,
      'Add Resource Store token block, Project Template Builder bot-service block, manual checkpoint and System Command launch block.',
      'The trigger should support the normal Execute button and browser-startup relaunch for a long-running server service.',
    ].join(' '),
  });
  await saveWorkflowProject(data.result.workflow, {
    label: 'Production Telegram bot-service workflow',
    source: data,
    openEditor: true,
  });
}

async function dryRunTelegramMessage() {
  const data = await callMcp('telegram.send_message', {
    tokenResource: telegramTokenResource.value,
    chatId: '123456',
    text: 'Привет от Silverback Coding',
    dryRun: true,
  });
  print('Telegram Message Dry Run', data);
}

async function runMcpTool() {
  const data = await callMcp(selectedMcpTool.value, parseJson(mcpArgs.value));
  print(`MCP Tool: ${selectedMcpTool.value}`, data);
}

async function loadPatchTemplate() {
  selectMcpTool('workflow.patch_template');
  await runMcpTool();
}

async function composeWorkflowPatch() {
  const data = await callMcp('workflow.compose_from_prompt', { prompt: composerPrompt.value });
  print('AI Workflow Composer', data);
}

async function composeWorkflow() {
  const data = await callMcp('workflow.build_from_prompt', {
    name: utilityName.value || 'AI generated Automa project',
    prompt: composerPrompt.value,
  });
  await saveWorkflowProject(data.result.workflow, {
    label: 'AI-проект Automa',
    source: data,
    openEditor: true,
  });
}

function browserPayload(useHtml = false) {
  const html = browserHtml.value.trim();
  const base = {
    browserEngine: browserEngine.value,
    profileName: browserProfileName.value.trim(),
    autoCreateProfile: true,
    headless: true,
    maxElements: 80,
  };
  if (useHtml || !browserUrl.value.trim()) {
    return { ...base, html };
  }

  return { ...base, url: browserUrl.value.trim(), captureNetwork: true };
}

async function scanBrowserUrl() {
  const data = await callMcp('browser.scan_page', browserPayload(false));
  print('Browser Scan URL', data);
}

async function scanBrowserHtml() {
  const data = await callMcp('browser.scan_page', browserPayload(true));
  print('Browser Scan HTML', data);
}

async function queryBrowserSelector() {
  const payload = {
    ...browserPayload(Boolean(browserHtml.value.trim())),
    selector: browserSelector.value,
    limit: 40,
  };
  const data = await callMcp('browser.query_selector', payload);
  print('Browser Query Selector', data);
}

async function suggestBrowserSelectors() {
  const payload = {
    ...browserPayload(Boolean(browserHtml.value.trim())),
    hint: selectorHint.value,
    maxElements: 80,
  };
  const data = await callMcp('browser.suggest_selectors', payload);
  print('Browser Selector Suggestions', data);
}

async function checkBrowserEngines() {
  const data = await callMcp('browser.engine_status', { browserEngine: browserEngine.value });
  print('Browser Engine Status', data);
}

async function createBrowserProfile() {
  const data = await callMcp('browser.profiles.create', {
    name: browserProfileName.value.trim() || 'demo-browser-profile',
    browserEngine: browserEngine.value,
    description: 'Создано в Automa Silverback Coding Studio',
  });
  print('Browser Profile Created', data);
}

async function listBrowserProfiles() {
  const data = await callMcp('browser.profiles.list');
  print('Browser Profiles', data);
}

async function saveWorkflowToAutoma(workflow) {
  if (!workflowStore.retrieved) await workflowStore.loadData();
  const inserted = await workflowStore.insert({
    ...workflow,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  Object.entries(inserted).forEach(([id, item]) => {
    const triggerBlock = findTriggerBlock(item.drawflow);
    if (triggerBlock) registerWorkflowTrigger(id, triggerBlock);
  });

  return inserted;
}

async function saveWorkflowProject(workflow, { label, source, openEditor = false } = {}) {
  const inserted = await saveWorkflowToAutoma(workflow);
  const [workflowId] = Object.keys(inserted);
  const editorRoute = `/workflows/${workflowId}`;
  const result = {
    ...source,
    insertedWorkflowIds: Object.keys(inserted),
    workflowId,
    editorRoute,
    workflowName: inserted[workflowId]?.name,
    nodeCount: inserted[workflowId]?.drawflow?.nodes?.length ?? 0,
    edgeCount: inserted[workflowId]?.drawflow?.edges?.length ?? 0,
  };

  print(label || 'Сохраненный Automa workflow project', result);
  if (openEditor && workflowId) {
    await router.push(editorRoute);
  }
  return result;
}

async function buildUtilityArtifact() {
  const data = await callMcp('workflow.build_from_prompt', {
    name: utilityName.value,
    prompt: utilityPrompt.value,
  });
  const inserted = await saveWorkflowToAutoma(data.result.workflow);
  print('Сохраненный Automa workflow', {
    ...data,
    insertedWorkflowIds: Object.keys(inserted),
    editorRoute: `/workflows/${Object.keys(inserted)[0]}`,
  });
}

async function buildUtilityWorkflow() {
  const data = await callMcp('workflow.build_from_prompt', {
    name: utilityName.value,
    prompt: utilityPrompt.value,
  });
  await saveWorkflowProject(data.result.workflow, {
    label: 'Сохраненный Automa workflow project',
    source: data,
    openEditor: true,
  });
}

async function buildHttpWorkflow() {
  const data = await callMcp('workflow.from_http_requests', {
    name: `${utilityName.value}-http`,
    requests: JSON.parse(httpRequestsJson.value),
  });
  await saveWorkflowProject(data.result.workflow, {
    label: 'Сохраненный HTTP workflow project',
    source: data,
    openEditor: true,
  });
}

async function saveResource() {
  const data = await callMcp('resources.set', {
    name: resourceName.value,
    type: resourceType.value,
    value: JSON.parse(resourceValue.value),
  });
  print('Resource Saved', data);
}

async function listResources() {
  const data = await callMcp('resources.list');
  print('Resources', data);
}

async function refreshProductionDashboard() {
  const data = await callMcp('production.dashboard', { limit: 8, includePreflight: true });
  productionDashboard.value = data.result;
  if (Array.isArray(data.result?.recipes)) projectRecipes.value = data.result.recipes;
  print('Production Dashboard', data);
}

async function runReleasePreflight() {
  const data = await callMcp('release.preflight', { runQuickChecks: false });
  productionDashboard.value = {
    ...(productionDashboard.value || {}),
    preflight: data.result,
    version: data.result?.version || productionDashboard.value?.version,
  };
  print('Release Preflight', data);
}

async function writeReleaseManifest() {
  const data = await callMcp('release.manifest', {
    name: 'silverback-coding-production-ui',
    runQuickChecks: false,
  });
  print('Release Manifest', data);
  await refreshProductionDashboard();
}

async function copyMcpJson() {
  const data = await callMcp('mcp.server.config');
  mcpJsonString.value = data.jsonString || data.result?.jsonString || '';
  let copied = false;
  if (navigator.clipboard && mcpJsonString.value) {
    try {
      await navigator.clipboard.writeText(mcpJsonString.value);
      copied = true;
    } catch (error) {
      copied = false;
    }
  }
  print('MCP JSON', { ok: true, copied, jsonString: mcpJsonString.value, source: data });
}

async function runProductionSession() {
  const data = await callMcp('sessions.run', {
    name: 'studio-production-session',
    tasks: [
      { action: 'uppercase', payload: { text: 'production session' } },
      { action: 'logic_compare', payload: { left: 'silverback coding', operator: 'contains', right: 'coding' } },
    ],
    retries: 1,
  });
  print('Production Session', data);
  await refreshProductionDashboard();
}

async function enqueueBrowserJob() {
  const data = await callMcp('browser.jobs.enqueue', {
    name: 'studio-selector-check',
    tool: 'browser.query_selector',
    arguments: {
      browserEngine: browserEngine.value,
      profileName: browserProfileName.value,
      autoCreateProfile: true,
      html: browserHtml.value,
      selector: browserSelector.value,
      limit: 5,
    },
  });
  print('Queued Browser Job', data);
  await refreshProductionDashboard();
}

async function runNextBrowserJob() {
  const data = await callMcp('browser.jobs.run_next', {});
  print('Run Browser Job', data);
  await refreshProductionDashboard();
}

async function createManualCheckpoint() {
  const data = await callMcp('manual.intervention.create', {
    title: 'Studio manual approval',
    reason: 'operator_review',
    instructions: 'Review the generated workflow or external page, then resume.',
    timeoutSeconds: 300,
  });
  print('Manual Gate Created', data);
  await refreshProductionDashboard();
}

async function resolveLatestManualCheckpoint() {
  const openGate = (productionDashboard.value?.manualInterventions || []).find((item) => item.status === 'open');
  if (!openGate) {
    print('Manual Gate', { ok: false, error: 'no open manual gate' });
    return;
  }
  const data = await callMcp('manual.intervention.respond', {
    id: openGate.id,
    decision: 'approve',
    note: 'approved from Silverback Studio',
  });
  print('Manual Gate Resolved', data);
  await refreshProductionDashboard();
}

async function planRecipePermissions() {
  const recipe = selectedProjectRecipe.value;
  const data = await callMcp('permissions.plan', {
    prompt: `${recipe?.prompt || utilityPrompt.value}\n${recipeExtraPrompt.value}`,
  });
  print('Recipe Permission Plan', data);
}

async function loadProjectRecipes() {
  const data = await callMcp('project.recipes.list', {});
  projectRecipes.value = data.result.recipes || [];
  if (!projectRecipes.value.find((recipe) => recipe.id === selectedRecipeId.value) && projectRecipes.value[0]) {
    selectedRecipeId.value = projectRecipes.value[0].id;
  }
  print('Project Recipes', data);
}

function selectProjectRecipe(recipe) {
  selectedRecipeId.value = recipe.id;
  utilityName.value = recipe.id;
  composerPrompt.value = recipe.prompt;
  utilityPrompt.value = recipe.prompt;
}

function loadSelectedRecipeIntoComposer() {
  const recipe = selectedProjectRecipe.value;
  if (!recipe) return;
  selectProjectRecipe(recipe);
  print('Recipe Loaded', { ok: true, recipe });
}

async function buildSelectedRecipe(openEditor = true) {
  const recipe = selectedProjectRecipe.value;
  const data = await callMcp('project.recipe.build', {
    id: recipe?.id || selectedRecipeId.value,
    projectName: utilityName.value || recipe?.id || 'silverback-project-recipe',
    extraPrompt: recipeExtraPrompt.value,
  });
  await saveWorkflowProject(data.result.workflow, {
    label: 'Recipe workflow project',
    source: data,
    openEditor,
  });
}

async function buildSelectedRecipeAndOpen() {
  await buildSelectedRecipe(true);
}

async function buildSelectedRecipeArtifact() {
  const recipe = selectedProjectRecipe.value;
  const data = await callMcp('project.recipe.build', {
    id: recipe?.id || selectedRecipeId.value,
    projectName: utilityName.value || recipe?.id || 'silverback-project-recipe',
    extraPrompt: recipeExtraPrompt.value,
  });
  print('Recipe Artifact', data);
}

async function runFullDemo() {
  const data = await callMcp('demo.run');
  print('Full Automa Silverback Coding Demo', data);
}

async function safeRun(task) {
  try {
    await task();
  } catch (error) {
    print('Ошибка', error.data || { ok: false, error: error.message });
  }
}

onMounted(async () => {
  selectAction(selectedAction.value);
  selectMcpTool(selectedMcpTool.value);
  await safeRun(refreshAll);
  await safeRun(loadProjectRecipes);
  await safeRun(refreshProductionDashboard);
  if (hasBridge.value) await safeRun(runFullDemo);
});
</script>

<style scoped>
.visual-coding-page {
  min-height: 100vh;
  padding: 24px;
  color: #f7f2ff;
  background:
    linear-gradient(180deg, rgba(124, 58, 237, 0.12), rgba(8, 6, 13, 0) 220px),
    #08060d;
  letter-spacing: 0;
}

.vc-header {
  display: flex;
  flex-direction: column;
  gap: 16px;
  justify-content: space-between;
  margin-bottom: 24px;
  padding-bottom: 22px;
  border-bottom: 1px solid rgba(167, 139, 250, 0.24);
}

.vc-brand-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.vc-brand-mark {
  display: grid;
  flex: 0 0 54px;
  width: 54px;
  height: 54px;
  place-items: center;
  border: 1px solid rgba(196, 181, 253, 0.55);
  border-radius: 8px;
  color: #f5f3ff;
  background: #171020;
  box-shadow: inset 0 0 0 1px rgba(124, 58, 237, 0.4), 0 10px 24px rgba(0, 0, 0, 0.26);
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0;
}

.vc-kicker {
  margin-bottom: 4px;
  color: #c4b5fd;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.vc-header h1 {
  margin: 0;
  color: #ffffff;
  font-size: 34px;
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: 0;
}

.vc-subtitle {
  max-width: 760px;
  margin-top: 8px;
  color: #c9c1d9;
  font-size: 15px;
  line-height: 1.5;
}

.vc-header-actions,
.vc-actions,
.vc-inline {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.vc-status-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.vc-status-card,
.vc-panel {
  border: 1px solid rgba(167, 139, 250, 0.2);
  border-radius: 8px;
  background: #120d1a;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.18);
}

.vc-status-card {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 76px;
  padding: 16px;
}

.vc-status-card p {
  margin: 0;
  color: #a99fbb;
  font-size: 13px;
  line-height: 1.35;
}

.vc-status-card strong {
  display: block;
  margin-top: 2px;
  color: #f7f2ff;
  font-size: 14px;
  font-weight: 750;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.vc-dot {
  flex: 0 0 12px;
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: #f59e0b;
}

.vc-dot.ok {
  background: #22c55e;
}

.vc-dot.bad {
  background: #ef4444;
}

.vc-dot.muted {
  background: #6b6477;
}

.vc-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 16px;
}

.vc-panel {
  display: grid;
  gap: 16px;
  padding: 16px;
}

.vc-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.vc-panel-head h2 {
  margin: 0;
  color: #ffffff;
  font-size: 16px;
  font-weight: 760;
  line-height: 1.35;
  letter-spacing: 0;
}

.vc-panel-head span {
  max-width: 48%;
  padding: 5px 8px;
  border: 1px solid rgba(167, 139, 250, 0.34);
  border-radius: 999px;
  color: #ddd6fe;
  background: rgba(124, 58, 237, 0.15);
  font-size: 12px;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.vc-form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.vc-metric-grid,
.vc-recipe-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.vc-mini-card,
.vc-recipe-card {
  border: 1px solid rgba(167, 139, 250, 0.22);
  border-radius: 8px;
  background: #0b0712;
}

.vc-mini-card {
  min-height: 74px;
  padding: 14px;
}

.vc-mini-card p,
.vc-recipe-card span {
  margin: 0;
  color: #a99fbb;
  font-size: 13px;
  line-height: 1.35;
}

.vc-mini-card strong,
.vc-recipe-card strong {
  display: block;
  margin-top: 5px;
  color: #f7f2ff;
  font-size: 14px;
  line-height: 1.35;
}

.vc-recipe-card {
  display: grid;
  gap: 6px;
  width: 100%;
  min-height: 112px;
  padding: 14px;
  text-align: left;
  cursor: pointer;
}

.vc-recipe-card.active {
  border-color: rgba(196, 181, 253, 0.78);
  background: #1d1230;
}

.vc-stack {
  display: grid;
  align-content: start;
  gap: 12px;
}

label {
  display: grid;
  gap: 8px;
  color: #c9c1d9;
  font-size: 14px;
  line-height: 1.4;
}

.vc-code-input {
  min-height: 140px;
  font-family: Consolas, "Cascadia Code", monospace;
  font-size: 13px;
  line-height: 1.45;
}

.vc-small-code {
  min-height: 84px;
}

.vc-output-panel {
  margin-top: 16px;
}

pre {
  min-height: 260px;
  max-height: 520px;
  margin: 0;
  overflow: auto;
  padding: 16px;
  border: 1px solid rgba(167, 139, 250, 0.18);
  border-radius: 8px;
  color: #d9f99d;
  background: #05030a;
  font-size: 14px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-family: Consolas, "Cascadia Code", monospace;
}

.visual-coding-page :deep(button) {
  border-color: rgba(167, 139, 250, 0.34);
  color: #f7f2ff;
  background: #1b1328;
  letter-spacing: 0;
}

.visual-coding-page :deep(button:hover) {
  border-color: rgba(196, 181, 253, 0.72);
  background: #25163c;
}

.visual-coding-page :deep(input),
.visual-coding-page :deep(select),
.visual-coding-page :deep(textarea) {
  border-color: rgba(167, 139, 250, 0.22);
  color: #f7f2ff;
  background: #08060d;
}

.visual-coding-page :deep(option),
.visual-coding-page :deep(optgroup) {
  color: #f7f2ff;
  background: #12081f;
}

.visual-coding-page :deep(input::placeholder),
.visual-coding-page :deep(textarea::placeholder) {
  color: #7e748d;
}

@media (min-width: 768px) {
  .vc-status-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .vc-header {
    flex-direction: row;
    align-items: flex-end;
  }

  .vc-form-grid {
    grid-template-columns: 220px minmax(0, 1fr);
  }

  .vc-metric-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .vc-recipe-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1280px) {
  .vc-status-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .vc-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .vc-span-2 {
    grid-column: span 2 / span 2;
  }
}
</style>
