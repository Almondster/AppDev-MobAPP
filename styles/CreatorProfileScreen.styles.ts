import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    header: {
        position: 'absolute', top: 50, left: 0, right: 0, zIndex: 10,
        flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24,
    },
    iconButton: {
        padding: 10, borderRadius: 24,
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3
    },

    scrollContent: { paddingTop: 110, paddingBottom: 40 },

    profileHeader: { alignItems: 'center', marginBottom: 32, paddingHorizontal: 24 },
    avatarContainer: {
        width: 110, height: 110, borderRadius: 55,
        justifyContent: 'center', alignItems: 'center',
        overflow: 'hidden', marginBottom: 16, borderWidth: 4,
    },
    avatarImage: { width: '100%', height: '100%' },
    avatarText: { color: '#fff', fontSize: 40, fontWeight: '700' },
    name: { fontSize: 26, fontWeight: '700', marginBottom: 4, textAlign: 'center' },
    role: { fontSize: 13, letterSpacing: 1.2, marginBottom: 24, fontWeight: '600' },

    statsContainer: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly',
        width: '100%', marginBottom: 24
    },
    statItem: { alignItems: 'center', minWidth: 60 },
    statText: { fontSize: 18, fontWeight: '700' },
    statLabel: { fontSize: 12 },
    statDivider: { width: 1, height: 24 },

    actionRow: { flexDirection: 'row', gap: 12, width: '100%', paddingHorizontal: 10 },
    actionBtn: {
        flex: 1, paddingVertical: 14, borderRadius: 16,
        justifyContent: 'center', alignItems: 'center'
    },
    actionBtnText: { fontSize: 16, fontWeight: '600' },
    messageBtn: {
        flexDirection: 'row', gap: 8, borderWidth: 1, backgroundColor: 'transparent'
    },
    messageBtnText: { fontSize: 16, fontWeight: '600' },

    blockedContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    blockedCard: {
        width: '100%',
        maxWidth: 400,
        padding: 40,
        borderRadius: 24,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24
    },
    blockedTitle: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 12,
        textAlign: 'center'
    },
    blockedDesc: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
        paddingHorizontal: 10
    },
    unblockBtnLarge: {
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
        borderWidth: 1
    },
    unblockTextLarge: {
        fontSize: 16,
        fontWeight: '700'
    },
    tabBar: { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: 24, marginBottom: 20 },
    tabItem: { paddingVertical: 14, marginRight: 24, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabText: { fontSize: 16, fontWeight: '600' },
    tabContent: { paddingHorizontal: 24 },
    sectionHeader: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
    bioText: { fontSize: 15, lineHeight: 24 },
    emptyState: { alignItems: 'center', marginTop: 40 },
    emptyText: { marginTop: 10, fontStyle: 'italic' },
    aboutCard: { borderRadius: 20, padding: 24, marginBottom: 20 },
    divider: { height: 1, width: '100%', marginVertical: 16 },
    metaGrid: { flexDirection: 'row', justifyContent: 'space-between' },
    metaItem: { alignItems: 'center', flex: 1 },
    metaLabel: { fontSize: 12, marginBottom: 4 },
    metaValue: { fontSize: 15, fontWeight: '600' },

    skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    skillChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
    skillText: { fontSize: 14, fontWeight: '500' },
    serviceCard: {
        flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, marginBottom: 16,
        shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3
    },
    serviceImageThumbnail: { width: 70, height: 70, borderRadius: 12, marginRight: 16 },
    serviceIconPlaceholder: { width: 70, height: 70, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    serviceInfo: { flex: 1, gap: 4 },
    serviceLabel: { fontSize: 16, fontWeight: '700' },
    serviceCategory: { fontSize: 12, opacity: 0.7 },
    servicePrice: { fontSize: 15, fontWeight: '600' },
    arrowBtn: { padding: 8, borderRadius: 20 },
    reviewCard: { padding: 20, borderRadius: 20, marginBottom: 16 },
    reviewHeader: { flexDirection: 'row', marginBottom: 10 },
    reviewerAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12, backgroundColor: '#ccc' },
    reviewerName: { fontSize: 15, fontWeight: '700' },
    reviewDate: { fontSize: 12 },
    reviewText: { fontSize: 15, lineHeight: 22 },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
    modalCard: { borderRadius: 24, padding: 24 },
    modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
    modalSubtitle: { fontSize: 14, marginBottom: 20, textAlign: 'center' },
    modalInput: { borderRadius: 16, padding: 16, fontSize: 16, height: 100, textAlignVertical: 'top', borderWidth: 1, marginBottom: 24 },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
    modalBtn: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center' },
    modalBtnText: { fontSize: 16, fontWeight: '600' },
    optionButton: { flexDirection: 'row', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
    optionButtonText: { fontSize: 16, fontWeight: '600' },
    modernAlertBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 30 },
    modernAlertCard: { width: '100%', borderRadius: 26, padding: 30, alignItems: 'center', elevation: 10 },
    alertIconContainer: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    modernAlertTitle: { fontSize: 22, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
    modernAlertMessage: { fontSize: 16, textAlign: 'center', marginBottom: 28, lineHeight: 22 },
    modernAlertButtons: { flexDirection: 'row', gap: 12, width: '100%' },
    modernAlertBtn: { flex: 1, paddingVertical: 16, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    modernAlertBtnSecondary: { backgroundColor: 'transparent', borderWidth: 1 },
    modernAlertBtnText: { fontSize: 16, fontWeight: '700' },
    fullScreenModalContainer: { flex: 1 },
    serviceModalHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)'
    },
    backButton: { padding: 8 },
    serviceModalHeaderTitle: { fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center' },
    fullScreenScrollView: { flex: 1 },
    serviceImageFullContainer: { height: 250, width: '100%' },
    serviceImageFull: { width: '100%', height: '100%' },
    serviceImageFullPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
    placeholderText: { fontSize: 16, marginTop: 8 },

    serviceContentContainer: { padding: 24 },
    serviceTitleFull: { fontSize: 28, fontWeight: '700', marginTop: 12, marginBottom: 8 },
    servicePriceFull: { fontSize: 24, fontWeight: '700', marginBottom: 20 },
    separator: { height: 1, width: '100%', marginBottom: 16, opacity: 0.5 },
    sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
    serviceDescriptionFull: { fontSize: 16, lineHeight: 24, marginBottom: 20 },

    detailsGridFull: { gap: 16 },
    detailItemFull: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    detailLabel: { fontSize: 14, marginBottom: 2 },
    detailValue: { fontSize: 16, fontWeight: '600' },

    floatingActionContainer: { padding: 20, paddingBottom: 40, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)' },
    requestButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, gap: 8 },
    requestButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
    catBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        marginBottom: 16
    },
    catBadgeText: {
        fontSize: 12,
        fontWeight: '700'
    },
});
