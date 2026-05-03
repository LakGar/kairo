import { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TabScreenHeader } from "@/components/tab-screen-header";
import { MOCK_CHAT_THREADS, MOCK_PROOF_PRIORITY } from "@/src/features/chat/chat.mock";
import type { ChatCategory } from "@/src/features/chat/chat.types";
import { ChatCategoryChips } from "@/src/features/chat/components/chat-category-chips";
import { ChatEmptyState } from "@/src/features/chat/components/chat-empty-state";
import { ChatPriorityCard } from "@/src/features/chat/components/chat-priority-card";
import { ChatThreadCard } from "@/src/features/chat/components/chat-thread-card";
import { HomeColors } from "@/src/features/home/home-tokens";

const TAB_BAR_SPACE = 120;

function filterThreads(
  threads: typeof MOCK_CHAT_THREADS,
  category: ChatCategory,
  query: string,
) {
  const q = query.trim().toLowerCase();
  const byCat =
    category === "all" ? threads : threads.filter((t) => t.category === category);
  if (!q) return byCat;
  return byCat.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      t.lastMessage.toLowerCase().includes(q),
  );
}

/**
 * Chat tab — event rooms, teams, proof threads, DMs (mock UI).
 * TODO: navigate to `/(tabs)/(home)/chat/[threadId]` (or similar) when thread screen exists.
 */
export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState<ChatCategory>("all");
  const [search, setSearch] = useState("");
  const headerPad = insets.top + 58;

  const filtered = useMemo(
    () => filterThreads(MOCK_CHAT_THREADS, category, search),
    [category, search],
  );

  const showPriority = category === "all" || category === "proof";

  return (
    <View style={[styles.root, { backgroundColor: HomeColors.bg }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: headerPad,
            paddingBottom: TAB_BAR_SPACE + insets.bottom + 16,
          },
        ]}
      >
        <Text style={styles.subtitle}>
          Event rooms, teams, and proof threads
        </Text>

        <View style={styles.searchWrap}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search chats"
            placeholderTextColor={HomeColors.textMuted}
            style={styles.searchInput}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            underlineColorAndroid="transparent"
            accessibilityLabel="Search chats"
          />
        </View>

        <ChatCategoryChips selected={category} onSelect={setCategory} />

        {showPriority ? (
          <ChatPriorityCard
            headline={MOCK_PROOF_PRIORITY.headline}
            lines={MOCK_PROOF_PRIORITY.lines}
            onReviewPress={() => {
              // TODO: navigate to proof review queue when route exists
              console.log("Review proof threads");
            }}
          />
        ) : null}

        {filtered.length === 0 ? (
          <ChatEmptyState />
        ) : (
          filtered.map((thread) => (
            <ChatThreadCard
              key={thread.id}
              thread={thread}
              onPress={() => {
                // TODO: router.push thread detail when route exists
                console.log("Open chat", thread.id);
              }}
            />
          ))
        )}
      </ScrollView>

      <View style={styles.headerLayer} pointerEvents="box-none">
        <TabScreenHeader variant="chat" chrome="feedDark" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  headerLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  subtitle: {
    color: HomeColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.1,
    marginBottom: 16,
    marginTop: 4,
  },
  searchWrap: {
    marginBottom: 16,
  },
  searchInput: {
    minHeight: 46,
    backgroundColor: HomeColors.cardLight,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HomeColors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: HomeColors.textPrimary,
    fontSize: 16,
    letterSpacing: -0.2,
  },
});
