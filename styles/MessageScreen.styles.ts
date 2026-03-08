import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 20, borderBottomWidth: 1 },
    headerTitle: { fontSize: 24, fontWeight: 'bold' },
    content: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    emptyState: { alignItems: 'center' },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 16 },
    emptyDesc: { fontSize: 14, marginTop: 8, textAlign: 'center' },
});
