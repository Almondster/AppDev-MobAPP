import { Platform, StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        padding: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        borderBottomWidth: 1
    },
    headerTitle: { fontSize: 24, fontWeight: '700' },
    scrollContent: { padding: 16, paddingBottom: 100 },
    card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16 },
    profileCard: { flexDirection: 'row', alignItems: 'center' },
    avatarWrapper: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#e2e8f0',
        marginRight: 16,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden'
    },
    avatarImage: { width: '100%', height: '100%' },
    profileInfo: { flex: 1 },
    userName: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
    userRole: { fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
    menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    menuText: { fontSize: 16, fontWeight: '500' },
});
