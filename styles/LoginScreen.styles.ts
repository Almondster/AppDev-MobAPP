import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    safe: {
        flex: 1,
    },
    themeToggleContainer: {
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    themeToggleButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 0,
    },
    hero: {
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 60,
        alignItems: 'center',
    },
    logo: {
        fontSize: 32,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 40,
    },
    logoAccent: {
        color: '#2563EB',
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 8,
    },
    heroSubtitle: {
        fontSize: 16,
        textAlign: 'center',
    },
    inlineLink: {
        color: '#387BFF',
        fontWeight: '500',
    },
    card: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 24,
        flex: 1,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -20,
    },
    fieldGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        borderWidth: 1.5,
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 56,
        fontSize: 16,
    },
    errorText: {
        color: '#DC2626',
        marginTop: 6,
        fontSize: 12,
    },
    passwordWrapper: {
        position: 'relative',
    },
    passwordInput: {
        paddingRight: 44,
    },
    passwordToggle: {
        position: 'absolute',
        right: 12,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: 24,
    },
    linkText: {
        color: '#2563EB',
        fontWeight: '600',
        fontSize: 14,
    },
    primaryButton: {
        borderRadius: 12,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    divider: {
        height: 1,
        flex: 1,
    },
    dividerText: {
        fontSize: 14,
        marginHorizontal: 12,
    },
    socialRow: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    socialButton: {
        flex: 1,
        borderWidth: 1.5,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        marginHorizontal: 4,
    },
    socialLabel: {
        fontSize: 14,
        marginLeft: 8,
        fontWeight: '500',
    },
    termsText: {
        textAlign: 'center',
        fontSize: 12,
        lineHeight: 16,
    },

    // MODAL STYLES
    modalContainer: { flex: 1, paddingTop: 20 },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1
    },
    modalTitle: { fontSize: 18, fontWeight: '700' },
    closeText: { color: '#387BFF', fontSize: 16, fontWeight: '600' },
    modalScroll: { padding: 20 },
    legalText: { fontSize: 14, lineHeight: 22 },

    // FORGOT PASSWORD MODAL
    forgotBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        padding: 20,
    },
    forgotCard: {
        borderRadius: 24,
        padding: 24,
    },
    forgotHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    forgotTitle: { fontSize: 20, fontWeight: '700' },
    forgotDesc: { fontSize: 14, marginBottom: 20, lineHeight: 20 },

    // MODERN MODAL ALERT STYLES 
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalAlertCard: {
        width: '100%',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },
    modalIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalAlertTitle: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
    },
    modalAlertMessage: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    modalAlertButton: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalAlertButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
