import { Redirect } from 'expo-router';

/** Legacy hub entry — collaborative projects now live under /(tabs)/projects. */
export default function ProjectsHubScreen() {
  return <Redirect href="/(tabs)/projects" />;
}
