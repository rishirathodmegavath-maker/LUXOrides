import { registerRootComponent } from 'expo';

// Must be imported before the app registers -- Android can relaunch the JS
// engine headlessly just to run this task's callback, without ever mounting
// App.tsx, so the task definition has to be reachable from this entry
// point's synchronous import graph.
import './src/tasks/backgroundLocationTask';
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
