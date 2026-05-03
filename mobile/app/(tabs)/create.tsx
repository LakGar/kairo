import { useRouter } from "expo-router";

import { CreateEventForm } from "@/src/features/events/create-event-form";

export default function CreateEventScreen() {
  const router = useRouter();
  return (
    <CreateEventForm
      onSuccess={(event) => {
        router.replace(`/(tabs)/events/${event.id}`);
      }}
    />
  );
}
