import { registerRootComponent } from 'expo';

import { initSentry } from './src/config/sentry';

// Must be imported before the app registers -- Android can relaunch the JS
// engine headlessly just to run this task's callback, without ever mounting
// App.tsx, so the task definition has to be reachable from this entry
// point's synchronous import graph.
import './src/tasks/backgroundLocationTask';
import App from './App';

// Before anything else runs -- a crash during font loading, session
// restore, or any other early App.tsx effect should still be captured.
initSentry();

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
