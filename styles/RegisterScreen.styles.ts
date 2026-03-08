import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    safe: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    hero: {
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 65,
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
        fontSize: 16,
    },
    card: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 40,
        flex: 1,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -20,
    },
    nameRow: {
        flexDirection: 'row',
        marginBottom: 16,
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
    inputError: {
        borderColor: '#DC2626',
    },
    pickerInput: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    birthDateText: {
        fontSize: 16,
    },
    phoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 56,
    },
    flagButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 8,
        borderRadius: 8,
        marginRight: 8,
    },
    flagEmoji: {
        fontSize: 20,
        marginRight: 4,
    },
    dialCode: {
        fontSize: 16,
        marginRight: 8,
        fontWeight: '500',
    },
    phoneInput: {
        flex: 1,
        borderWidth: 0,
        backgroundColor: 'transparent',
        paddingHorizontal: 0,
        height: '100%',
        fontSize: 16,
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
    primaryButton: {
        borderRadius: 12,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    errorText: {
        color: '#DC2626',
        marginTop: 6,
        fontSize: 12,
    },
    modalContainer: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        paddingHorizontal: 24,
        paddingTop: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    countryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
    },
    countryFlag: {
        fontSize: 24,
        marginRight: 12,
    },
    countryName: {
        fontSize: 16,
        fontWeight: '500',
    },
    countryDial: {
        fontSize: 14,
    },
    dateModalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    dateModalCard: {
        borderRadius: 16,
        width: '100%',
        padding: 20,
    },
    datePickerClose: {
        marginTop: 16,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    datePickerCloseText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
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
