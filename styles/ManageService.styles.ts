import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { padding: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#0F172A' },
    content: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    emptyState: { alignItems: 'center' },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#334155', marginTop: 16 },
    emptyDesc: { fontSize: 14, color: '#64748B', marginTop: 8, textAlign: 'center' },
});
