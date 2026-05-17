import { Redirect } from 'expo-router'

// Default route — _layout.tsx auth logic will redirect to the correct group.
// This just gives Expo Router a valid landing point so the Stack never renders blank.
export default function Index() {
  return <Redirect href="/(auth)/login" />
}
