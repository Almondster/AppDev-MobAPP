import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: { flex: 1 },
    headerContainer: {
        paddingTop: 60,
        paddingBottom: 0,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 2,
        zIndex: 10,
    },
    headerTitle: { fontSize: 28, fontWeight: '700', paddingHorizontal: 24, marginBottom: 16 },
    searchBar: {
        marginHorizontal: 24,
        borderRadius: 12,
        flexDirection: 'row',
        paddingHorizontal: 16,
        height: 50,
        alignItems: 'center',
        marginBottom: 16,
    },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 16, height: '100%' },
    tabsContainer: { flexDirection: 'row' },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        position: 'relative'
    },
    tabText: { fontSize: 16, fontWeight: '600' },
    activeIndicator: {
        position: 'absolute',
        bottom: 0,
        height: 4,
        width: 40,
        borderRadius: 4,
    },
    scrollContent: { paddingHorizontal: 24, paddingVertical: 24, paddingBottom: 24 },
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },

    // --- UPDATED CARD STYLES ---
    gridCard: {
        borderRadius: 16,
        height: 180,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        overflow: 'hidden'
    },
    // Used for Creators AND Dark Mode Services
    centeredCard: {
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Used for Dark Mode Services (Legacy Style)
    iconPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12
    },

    // --- NEW STYLES (Light Mode Services) ---
    cardHeader: {
        height: 100,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 8,
    },

    // Creator specific styles
    avatarPlaceholder: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 12, overflow: 'hidden' },
    avatarImage: { width: '100%', height: '100%' },
    avatarText: { fontSize: 24, fontWeight: '700' },

    // Shared Text Styles
    cardTitle: { fontSize: 14, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
    cardSubtitle: { fontSize: 12, textAlign: 'center' },
});
