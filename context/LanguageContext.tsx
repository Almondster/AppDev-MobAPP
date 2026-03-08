import { auth } from '@/frontend/session';
import { supabase } from '@/frontend/store';
import React, { createContext, useContext, useEffect, useState } from 'react';

// 1. EXPANDED TRANSLATION DICTIONARY
const translations = {
  English: {
    // --- GLOBAL / COMMON ---
    greeting: 'Hello',
    welcomeBack: 'Welcome back.',
    seeAll: 'See All',
    loading: 'Loading...',
    success: 'Success',
    error: 'Error',
    cancel: 'Cancel',
    close: 'Close',
    done: 'Done',
    saveChanges: 'Save Changes',

    // --- PROFILE: SECURITY & ERRORS ---
    currentPasswordRequired: 'Current Password Required',
    currentPasswordRequiredMsg: 'Please enter your current password to make changes.',
    invalidEmail: 'Invalid Email',
    invalidEmailMsg: 'Please enter a valid email address.',
    incompletePassword: 'Incomplete Password',
    incompletePasswordMsg: 'Please fill in both new password fields.',
    passwordMismatch: 'Password Mismatch',
    passwordMismatchMsg: 'New passwords do not match.',
    weakPassword: 'Weak Password',
    weakPasswordMsg: 'Password must be at least 8 characters long.',
    noChanges: 'No Changes',
    noChangesMsg: 'You haven\'t made any changes to update.',
    verificationEmailSent: 'Verification Email Sent',
    verificationEmailSentMsg: 'A verification link has been sent to {email}. Please check your inbox.',
    partialSuccess: 'Partial Success',
    partialSuccessMsg: 'Email updated in authentication but profile sync failed. Please contact support.',
    updateFailed: 'Update Failed',
    securityUpdateSuccess: 'Password updated successfully.',

    // --- PROFILE: SUPPORT & EXPORT ---
    ticketSubmitted: 'Ticket Submitted',
    ticketSubmittedMsg: 'Your support request has been received.\n\nTicket ID: {id}\n\nWe\'ll respond within 24-48 hours.',
    exportProcessing: 'Processing',
    exportProcessingMsg: 'Preparing your data export. This may take a moment...',
    exportComplete: 'Export Complete',
    exportCompleteMsg: 'Your data has been downloaded as a JSON file.',
    exportReady: 'Export Ready',
    exportReadyMsg: 'Your data export is ready. Contact support to receive your complete data export via email.',
    yourData: 'Your Data',
    preferencesSaved: 'Preferences Saved',
    preferencesSavedMsg: 'Your notification preferences have been updated successfully.',

    // --- PROFILE: FINANCE ERRORS ---
    enterBankDetails: 'Please enter bank details.',
    enterCardNumber: 'Please enter card number.',
    enterMobileNumber: 'Please enter your mobile number.',
    addedSuccess: '{type} added successfully.',
    couldNotUnfollow: 'Could not unfollow.',
    describeIssue: 'Please describe your issue before submitting.',
    sessionNotFound: 'User session not found. Please log in again.',

    // --- ABOUT ---
    aboutTitle: 'About CREATECH',
    aboutMsg: 'Version 1.0.0\n\nA platform connecting clients with talented creators.\n\n© 2025 CREATECH',
    back: 'Back',
    next: 'Next Step',
    continue: 'Continue',
    submit: 'Submit',
    delete: 'Delete',
    edit: 'Edit',
    viewProfile: 'View Profile',
    message: 'Message',
    understood: 'Understood',
    okay: 'Okay',
    yes: 'Yes',
    no: 'No',

    // --- AUTH & ERRORS ---
    loginRequired: 'Login Required',
    loginMsg: 'You must be logged in to perform this action.',
    blocked: 'Blocked',
    blockedMsg: 'You have blocked this user.',
    serviceUnavailable: 'Service Unavailable',
    serviceUnavailableMsg: 'You have blocked this creator and cannot request their services.',

    // --- HOME SCREEN ---
    servicesCat: 'Services Category',
    recentlyMatched: 'Recently Matched',
    topCreators: 'Top Creators',
    creatorServices: 'Creator Services',
    creatorRole: 'Creator',

    // --- SEARCH SCREEN ---
    searchTitle: 'Search',
    searchPlaceholder: 'Search...',
    tabServices: 'Services',
    tabCreators: 'Creators',
    findCreators: 'Find Creators',
    noServicesFound: 'No services found.',
    noCreatorsFound: 'No creators found.',

    // --- SMART MATCH (FLOW) ---
    aiMatchTitle: 'AI Smart Match',
    step: 'Step',
    matchQuestion: 'What service are you looking for?',
    matchDesc: 'Select a category to help us find the perfect match.',
    selectSkills: 'Select required skills for',
    chooseSkills: 'Choose all skills relevant to your project',
    describeProject: 'Describe your project',
    describeProjectDesc: 'The more details you provide, the better matches you\'ll get',
    projectDescPlaceholder: 'Example: I need a modern e-commerce website...',
    budgetTimeline: 'Budget & Timeline',
    budgetTimelineDesc: 'Help us find creators within your range',
    projectBudget: 'Project Budget',
    projectTimeline: 'Project Timeline',

    // --- SMART MATCH (LOADING/RESULTS) ---
    findingMatch: 'Finding Your Perfect Match',
    aiAnalyzing: 'AI is analyzing your requirements...',
    rankingMatches: 'Ranking best matches...',
    matchesFound: 'Matches Found',
    foundCreators: 'Found creators matching your skills',
    noMatches: 'No matches found',
    adjustSkills: 'Adjust Skills',
    matchScore: 'Match',

    // --- PROFILE: PERSONAL ---
    profileTitle: 'Profile',
    myDetails: 'My Details',
    personalDetails: 'Personal Details',
    firstName: 'First Name',
    middleName: 'Middle Name (Optional)',
    lastName: 'Last Name',
    birthdate: 'Birthdate',
    age: 'Age',
    gender: 'Gender',
    nationality: 'Nationality',
    phone: 'Phone Number',
    address: 'Residential Address',

    // --- PROFILE: CREATOR ---
    creatorProfile: 'Creator Profile',
    profileOverview: 'Profile Overview',
    bio: 'Bio / About',
    yearsExp: 'Years of Experience',
    serviceDetails: 'Service Details',
    startingPrice: 'Starting Price (₱)',
    turnaroundTime: 'Turnaround Time',
    portfolioUrl: 'Portfolio URL',
    currentSkills: 'Current Skills',

    // --- PROFILE: SETTINGS & MENU ---
    account: 'Account',
    finance: 'Finance',
    settings: 'Settings',
    following: 'Following',
    security: 'Security',
    securitySub: 'Login & Security',
    wallet: 'Wallet',
    paymentMethods: 'Payment Methods',
    language: 'Language',
    helpCenter: 'Help Center',
    support: 'Support',
    logout: 'Log Out',
    logoutConfirm: 'Are you sure you want to sign out?',
    socialWarning: 'You are logged in via a social provider.\nPlease manage your security there.',
    changePass: 'Change Password',
    currPass: 'Current Password',
    newPass: 'New Password',
    confirmPass: 'Confirm New Password',
    updateCreds: 'Update Credentials',
    forgotPass: 'Forgot Password?',

    // --- BECOME CREATOR ---
    becomeCreator: 'Become a Creator',
    becomeCreatorSub: 'Start selling your services today',
    identityVerif: 'Identity Verification',
    profProfile: 'Professional Profile',
    reviewAgree: 'Review & Agree',
    govId: 'Government ID Number (12 Digits)',
    uploadId: 'Upload ID Photo',
    trustSafety: 'To ensure trust and safety, we require verified personal information.',
    selectCategory: 'Select Service Category',
    termsTitle: 'Creator Terms of Service',
    termsText: 'I verify that the information provided is accurate and I agree to the terms.',
    submitApp: 'Submit Application',

    // --- MANAGE SERVICES ---
    manageServices: 'Manage Services',
    newService: 'New Service',
    editService: 'Edit Service',
    coverImage: 'Cover Image',
    serviceTitle: 'Service Title',
    category: 'Category',
    subcategory: 'Subcategory',
    description: 'Description',
    postService: 'Post Service',
    updateService: 'Update Service',
    deleteServiceTitle: 'Delete Service',
    deleteServiceMsg: 'Are you sure you want to delete this service? This cannot be undone.',

    // --- ORDERS & LISTINGS ---
    myOrders: 'My Orders',
    myGigs: 'My Gigs', // For Creators
    searchOrders: 'Search orders...',
    noOrders: 'No orders found.',
    requestService: 'Request Service',
    requestSent: 'Request Sent!',
    requestSentDesc: 'Your request has been sent. The creator will review it shortly.',
    duplicateRequest: 'Request Already Sent',
    ownServiceError: 'You cannot request your own service.',
    viewOrders: 'View My Orders',

    // --- ORDER ACTIONS ---
    statusPending: 'PENDING',
    statusAccepted: 'WAITING PAYMENT',
    statusInProgress: 'IN PROGRESS',
    statusDelivered: 'IN REVIEW',
    statusCompleted: 'COMPLETED',
    statusCancelled: 'CANCELLED',
    statusRejected: 'REJECTED',

    acceptOrder: 'Accept',
    rejectOrder: 'Reject',
    cancelRequest: 'Cancel Request',
    payOrder: 'Pay to Start Order',
    submitWork: 'Submit Work',
    reviewRelease: 'Review & Release Payment',
    downloadFile: 'Download Final File',
    rateCreator: 'Rate Creator',
    bookAgain: 'Book Again',

    // --- PAYMENTS & UPLOADS ---
    selectPayment: 'Select Payment Method',
    totalPay: 'Total to Pay',
    uploadPreview: 'Upload Preview',
    uploadFinal: 'Upload Final File',
    shareLink: 'Share Link',
    uploadFile: 'Upload File',
    previewUrl: 'Preview URL',
    finalUrl: 'Final File URL',
    submitDelivery: 'Submit Delivery',
    orderDelivered: 'Order Delivered!',
    releasePayment: 'Release Payment',

    // --- MESSAGING ---
    messagesTitle: 'Messages',
    searchMessages: 'Search messages...',
    noMessages: 'No messages yet.',
    startConvo: 'Start the conversation by sending a message.',
    typeMessage: 'Message...',
    filterMessages: 'Filter Messages',
    unreadOnly: 'Unread messages only',
    sortBy: 'Sort by',
    mostRecent: 'Most recent',
    unreadFirst: 'Unread first',
    applyFilters: 'Apply Filters',
    deleteConvo: 'Delete Conversation',
    blockUser: 'Block User',
    searchInChat: 'Search in Chat',

    // --- ANALYTICS (CREATOR) ---
    todaysEarnings: "Today's Earnings",
    lastMonth: 'Last Month',
    avgResponse: 'Avg Response',
    rating: 'Rating',
    interactions: 'Interactions',
    views: 'Views',
    clicks: 'Clicks',
    activeJobs: 'Active Jobs',
    ongoingProjects: 'Ongoing Projects',

    // --- ALERTS ---
    alertSuccess: 'Success!',
    alertError: 'Error',
    alertWarning: 'Warning',

    // --- REFUNDS & EXTENSIONS ---
    refundRequest: 'Request Refund',
    refundReason: 'Reason for refund',
    refundSubmitted: 'Refund request submitted',
    refundApproved: 'Refund Approved',
    refundDenied: 'Refund Denied',
    refundProcessed: 'The refund has been processed.',
    refundDeniedMsg: 'Refund denied. Please deliver work immediately.',
    extensionRequest: 'Request Extension',
    extensionReason: 'Reason for extension',
    extensionDays: 'Days',
    extensionHours: 'Hours',
    extensionMinutes: 'Minutes',
    extensionSubmitted: 'Extension request sent',
    extensionApproved: 'Extension Approved',
    extensionDenied: 'Extension Denied',
    extensionApprovedMsg: 'The deadline has been extended.',
    extensionDeniedMsg: 'The extension request has been denied.',
    autoRefundMsg: 'Refund auto-processed due to lack of response/delivery.',

    // --- SMART MATCH LOADING ---
    aiAnalyzingTitle: 'AI Analyzing Your Project',
    aiAnalyzingDesc: 'Gemini is evaluating creator portfolios, experience, and track records to find your perfect match...',
    stepAnalyzing: 'Analyzing project requirements',
    stepEvaluating: 'Evaluating creator portfolios',
    stepCalculating: 'Calculating compatibility scores',
    aiFoundMatches: 'AI found {count} creators matching your project',
    basicFoundMatches: 'Found {count} creators matching your skills',
    noBio: 'No bio available.',
    keyStrength: 'Key Strength',
    consider: 'Consider',
    aiAnalysis: 'AI Analysis',

    // --- COMMON ALERTS ---
    confirmRemove: 'Remove from History?',
    confirmRemoveMsg: 'This will hide this order from your view but preserve the transaction data.',
    orderActive: 'Order Active',
    orderActiveMsg: 'You already have an active request for this service.',
    invalidDeadline: 'Invalid Deadline',
    fileTooLarge: 'File Too Large',
    missingLinks: 'Missing Links',
    securityLinks: 'For security, we only accept links from Dropbox or Google Drive.',
  },
  Filipino: {
    // --- GLOBAL / COMMON ---
    greeting: 'Kamusta',
    welcomeBack: 'Maligayang pagbabalik.',
    seeAll: 'Tignan Lahat',
    loading: 'Naglo-load...',
    success: 'Tagumpay',
    error: 'Error',
    cancel: 'Kanselahin',
    close: 'Isara',
    done: 'Tapos na',
    saveChanges: 'I-save ang Pagbabago',

    // --- PROFILE: SECURITY & ERRORS ---
    currentPasswordRequired: 'Kailangan ang Kasalukuyang Password',
    currentPasswordRequiredMsg: 'Mangyaring ilagay ang iyong kasalukuyang password upang makagawa ng pagbabago.',
    invalidEmail: 'Maling Email',
    invalidEmailMsg: 'Mangyaring maglagay ng valid na email address.',
    incompletePassword: 'Kulang na Password',
    incompletePasswordMsg: 'Punan ang parehong field ng bagong password.',
    passwordMismatch: 'Hindi Tugma ang Password',
    passwordMismatchMsg: 'Hindi magkatugma ang mga bagong password.',
    weakPassword: 'Mahinang Password',
    weakPasswordMsg: 'Dapat hindi bababa sa 8 karakter ang password.',
    noChanges: 'Walang Pagbabago',
    noChangesMsg: 'Wala kang ginawang pagbabago.',
    verificationEmailSent: 'Naipadala ang Verification Email',
    verificationEmailSentMsg: 'May ipinadalang verification link sa {email}. Pakitingnan ang iyong inbox.',
    partialSuccess: 'Bahagyang Tagumpay',
    partialSuccessMsg: 'Na-update ang email sa authentication pero nabigo ang profile sync. Kontakin ang suporta.',
    updateFailed: 'Nabigo ang Pag-update',
    securityUpdateSuccess: 'Matagumpay na na-update ang password.',

    // --- PROFILE: SUPPORT & EXPORT ---
    ticketSubmitted: 'Naipasa ang Ticket',
    ticketSubmittedMsg: 'Natanggap na ang iyong hiling.\n\nTicket ID: {id}\n\nSasagot kami sa loob ng 24-48 oras.',
    exportProcessing: 'Pinoproseso',
    exportProcessingMsg: 'Inihahanda ang iyong data export. Sandali lang...',
    exportComplete: 'Tapos na ang Export',
    exportCompleteMsg: 'Na-download na ang iyong data bilang JSON file.',
    exportReady: 'Handa na ang Export',
    exportReadyMsg: 'Handa na ang iyong data export. Kontakin ang suporta para makuha ito via email.',
    yourData: 'Ang Iyong Data',
    preferencesSaved: 'Na-save ang Preferences',
    preferencesSavedMsg: 'Matagumpay na na-update ang iyong notification preferences.',

    // --- PROFILE: FINANCE ERRORS ---
    enterBankDetails: 'Ilagay ang detalye ng bangko.',
    enterCardNumber: 'Ilagay ang numero ng card.',
    enterMobileNumber: 'Ilagay ang numero ng mobile.',
    addedSuccess: 'Matagumpay na naidagdag ang {type}.',
    couldNotUnfollow: 'Hindi ma-unfollow.',
    describeIssue: 'Ilarawan ang iyong isyu bago ipasa.',
    sessionNotFound: 'Hindi mahanap ang user session. Mag-login muli.',

    // --- ABOUT ---
    aboutTitle: 'Tungkol sa CREATECH',
    aboutMsg: 'Bersyon 1.0.0\n\nIsang platform na nag-uugnay sa mga kliyente at magagaling na creators.\n\n© 2025 CREATECH',
    back: 'Bumalik',
    next: 'Susunod',
    continue: 'Magpatuloy',
    submit: 'Ipasa',
    delete: 'Burahin',
    edit: 'I-edit',
    viewProfile: 'Tignan ang Profile',
    message: 'Mensahe',
    understood: 'Naintindihan ko',
    okay: 'Sige',
    yes: 'Oo',
    no: 'Hindi',

    // --- AUTH & ERRORS ---
    loginRequired: 'Kailangan Mag-login',
    loginMsg: 'Kailangan mong mag-login upang magawa ito.',
    blocked: 'Naka-block',
    blockedMsg: 'I-binlock mo ang user na ito.',
    serviceUnavailable: 'Hindi Magamit ang Serbisyo',
    serviceUnavailableMsg: 'I-binlock mo ang creator na ito kaya hindi ka makakahiling ng serbisyo.',

    // --- HOME SCREEN ---
    servicesCat: 'Kategorya ng Serbisyo',
    recentlyMatched: 'Kamakailang Nakatugma',
    topCreators: 'Nangungunang Creator',
    creatorServices: 'Serbisyo ng mga Creator',
    creatorRole: 'Creator',

    // --- SEARCH SCREEN ---
    searchTitle: 'Hanapin',
    searchPlaceholder: 'Maghanap ng serbisyo, skills, o creator...',
    tabServices: 'Serbisyo',
    tabCreators: 'Creators',
    findCreators: 'Maghanap ng Creator',
    noServicesFound: 'Walang serbisyong nahanap.',
    noCreatorsFound: 'Walang creator na nahanap.',

    // --- SMART MATCH (FLOW) ---
    aiMatchTitle: 'AI Smart Match',
    step: 'Hakbang',
    matchQuestion: 'Anong serbisyo ang hanap mo?',
    matchDesc: 'Pumili ng kategorya upang mahanap ang tamang kapareha.',
    selectSkills: 'Pumili ng kasanayan para sa',
    chooseSkills: 'Piliin ang lahat ng kasanayang kailangan',
    describeProject: 'Ilarawan ang proyekto',
    describeProjectDesc: 'Mas maraming detalye, mas tamang kapareha ang mahahanap',
    projectDescPlaceholder: 'Halimbawa: Kailangan ko ng e-commerce website...',
    budgetTimeline: 'Budget at Timeline',
    budgetTimelineDesc: 'Tulungan kaming maghanap ng pasok sa budget mo',
    projectBudget: 'Budget ng Proyekto',
    projectTimeline: 'Timeline ng Proyekto',

    // --- SMART MATCH (LOADING/RESULTS) ---
    findingMatch: 'Hinahanap ang Perpektong Kapareha',
    aiAnalyzing: 'Sinusuri ng AI ang iyong mga kailangan...',
    rankingMatches: 'Niraranggo ang mga tugma...',
    matchesFound: 'May Nahanap na Kapareha',
    foundCreators: 'Nahanap na creators na tugma sa skills',
    noMatches: 'Walang nahanap na kapareha',
    adjustSkills: 'Ayusin ang Skills',
    matchScore: 'Tugma',

    // --- PROFILE: PERSONAL ---
    profileTitle: 'Propayl',
    myDetails: 'Aking Detalye',
    personalDetails: 'Personal na Detalye',
    firstName: 'Pangalan',
    middleName: 'Gitnang Pangalan (Opsyonal)',
    lastName: 'Apelyido',
    birthdate: 'Kaarawan',
    age: 'Edad',
    gender: 'Kasarian',
    nationality: 'Nasyonalidad',
    phone: 'Numero ng Telepono',
    address: 'Tirahan',

    // --- PROFILE: CREATOR ---
    creatorProfile: 'Propayl ng Creator',
    profileOverview: 'Pangkalahatang-ideya',
    bio: 'Bio / Tungkol sa Akin',
    yearsExp: 'Taon ng Karanasan',
    serviceDetails: 'Detalye ng Serbisyo',
    startingPrice: 'Panimulang Presyo (₱)',
    turnaroundTime: 'Oras ng Pagtatapos',
    portfolioUrl: 'URL ng Portfolio',
    currentSkills: 'Kasalukuyang Skills',

    // --- PROFILE: SETTINGS & MENU ---
    account: 'Account',
    finance: 'Pinansyal',
    settings: 'Settings',
    following: 'Sinusundan',
    security: 'Seguridad',
    securitySub: 'Login at Seguridad',
    wallet: 'Wallet',
    paymentMethods: 'Paraan ng Pagbayad',
    language: 'Wika',
    helpCenter: 'Help Center',
    support: 'Suporta',
    logout: 'Mag-log Out',
    logoutConfirm: 'Sigurado ka bang gusto mong mag-log out?',
    socialWarning: 'Naka-login ka gamit ang social provider.\nMangyaring ayusin ang seguridad doon.',
    changePass: 'Palitan ang Password',
    currPass: 'Kasalukuyang Password',
    newPass: 'Bagong Password',
    confirmPass: 'Kumpirmahin ang Password',
    updateCreds: 'I-update ang Credentials',
    forgotPass: 'Nakalimutan ang Password?',

    // --- BECOME CREATOR ---
    becomeCreator: 'Maging Creator',
    becomeCreatorSub: 'Simulan ang pagbenta ng serbisyo',
    identityVerif: 'Pagpapatunay ng Pagkakakilanlan',
    profProfile: 'Propesyonal na Propayl',
    reviewAgree: 'Suriin at Sumang-ayon',
    govId: 'ID ng Gobyerno (12 Digits)',
    uploadId: 'I-upload ang ID',
    trustSafety: 'Para sa seguridad, kailangan namin ng beripikadong impormasyon.',
    selectCategory: 'Pumili ng Kategorya',
    termsTitle: 'Kasunduan para sa Creator',
    termsText: 'Pinapatunayan kong tama ang impormasyon at sumasang-ayon ako sa kasunduan.',
    submitApp: 'Ipasa ang Aplikasyon',

    // --- MANAGE SERVICES ---
    manageServices: 'Pamahalaan ang Serbisyo',
    newService: 'Bagong Serbisyo',
    editService: 'I-edit ang Serbisyo',
    coverImage: 'Cover na Larawan',
    serviceTitle: 'Pamagat ng Serbisyo',
    category: 'Kategorya',
    subcategory: 'Subkategorya',
    description: 'Paglalarawan',
    postService: 'I-post ang Serbisyo',
    updateService: 'I-update ang Serbisyo',
    deleteServiceTitle: 'Burahin ang Serbisyo',
    deleteServiceMsg: 'Sigurado ka bang buburahin ito? Hindi na ito maibabalik.',

    // --- ORDERS & LISTINGS ---
    myOrders: 'Aking Orders',
    myGigs: 'Aking Gigs',
    searchOrders: 'Maghanap ng order...',
    noOrders: 'Walang order na nahanap.',
    requestService: 'Humiling ng Serbisyo',
    requestSent: 'Naipadala na!',
    requestSentDesc: 'Naipadala na ang iyong hiling. Susuriin ito ng creator.',
    duplicateRequest: 'May Pending na Hiling',
    ownServiceError: 'Hindi mo maaaring hilingin ang sarili mong serbisyo.',
    viewOrders: 'Tignan ang Orders',

    // --- ORDER ACTIONS ---
    statusPending: 'PENDING',
    statusAccepted: 'NAGHIHINTAY NG BAYAD',
    statusInProgress: 'GINAGAWA NA',
    statusDelivered: 'FOR REVIEW',
    statusCompleted: 'TAPOS NA',
    statusCancelled: 'KINANSELA',
    statusRejected: 'TINANGGIHAN',

    acceptOrder: 'Tanggapin',
    rejectOrder: 'Tanggihan',
    cancelRequest: 'Kanselahin',
    payOrder: 'Magbayad',
    submitWork: 'Ipasa ang Trabaho',
    reviewRelease: 'Suriin at Magbayad',
    downloadFile: 'I-download ang File',
    rateCreator: 'I-rate ang Creator',
    bookAgain: 'Mag-book Ulit',

    // --- PAYMENTS & UPLOADS ---
    selectPayment: 'Pumili ng Paraan ng Pagbayad',
    totalPay: 'Babarayin',
    uploadPreview: 'I-upload ang Preview',
    uploadFinal: 'I-upload ang Final File',
    shareLink: 'I-share ang Link',
    uploadFile: 'I-upload ang File',
    previewUrl: 'Link ng Preview',
    finalUrl: 'Link ng Final File',
    submitDelivery: 'Ipasa ang Delivery',
    orderDelivered: 'Naihatid na ang Order!',
    releasePayment: 'Ilabas ang Bayad',

    // --- MESSAGING ---
    messagesTitle: 'Mensahe',
    searchMessages: 'Maghanap ng mensahe...',
    noMessages: 'Walang mensahe.',
    startConvo: 'Simulan ang usapan sa pagpapadala ng mensahe.',
    typeMessage: 'Mensahe...',
    filterMessages: 'I-filter ang Mensahe',
    unreadOnly: 'Hindi pa nababasa lang',
    sortBy: 'Ayusin ayon sa',
    mostRecent: 'Pinakabago',
    unreadFirst: 'Di pa nababasa muna',
    applyFilters: 'I-apply ang Filter',
    deleteConvo: 'Burahin ang Usapan',
    blockUser: 'I-block ang User',
    searchInChat: 'Maghanap sa Chat',

    // --- ANALYTICS (CREATOR) ---
    todaysEarnings: "Kita Ngayon",
    lastMonth: 'Nakaraang Buwan',
    avgResponse: 'Avg na Sagot',
    rating: 'Rating',
    interactions: 'Interaksyon',
    views: 'Views',
    clicks: 'Clicks',
    activeJobs: 'Aktibong Trabaho',
    ongoingProjects: 'Kasalukuyang Proyekto',

    // --- ALERTS ---
    alertSuccess: 'Tagumpay!',
    alertError: 'Error',
    alertWarning: 'Babala',

    // --- REFUNDS & EXTENSIONS ---
    refundRequest: 'Humiling ng Refund',
    refundReason: 'Dahilan ng refund',
    refundSubmitted: 'Naipasa na ang hiling na refund',
    refundApproved: 'Refund Inaprubahan',
    refundDenied: 'Refund Tinanggihan',
    refundProcessed: 'Naproseso na ang refund.',
    refundDeniedMsg: 'Tinanggihan ang refund. Mangyaring ihatid agad ang trabaho.',
    extensionRequest: 'Humiling ng Extension',
    extensionReason: 'Dahilan ng extension',
    extensionDays: 'Araw',
    extensionHours: 'Oras',
    extensionMinutes: 'Minuto',
    extensionSubmitted: 'Naipadala na ang hiling na extension',
    extensionApproved: 'Extension Inaprubahan',
    extensionDenied: 'Extension Tinanggihan',
    extensionApprovedMsg: 'Napahaba na ang deadline.',
    extensionDeniedMsg: 'Tinanggihan ang hiling na extension.',
    autoRefundMsg: 'Auto-refund dahil walang sagot/delivery.',

    // --- SMART MATCH LOADING ---
    aiAnalyzingTitle: 'Sinusuri ng AI ang Proyekto',
    aiAnalyzingDesc: 'Sinusuri ng Gemini ang mga portfolio at karanasan upang mahanap ang tamang kapareha...',
    stepAnalyzing: 'Sinusuri ang mga kailangan sa proyekto',
    stepEvaluating: 'Tinitignan ang mga portfolio',
    stepCalculating: 'Kinakalkula ang compatibility scores',
    aiFoundMatches: 'Nahanap ng AI ang {count} na creator na tugma sa proyekto',
    basicFoundMatches: 'Nahanap ang {count} na creator na tugma sa skills',
    noBio: 'Walang bio.',
    keyStrength: 'Pangunahing Lakas',
    consider: 'Isaalang-alang',
    aiAnalysis: 'Pagsusuri ng AI',

    // --- COMMON ALERTS ---
    confirmRemove: 'Alisin sa Kasaysayan?',
    confirmRemoveMsg: 'Itatago nito ang order pero mananatili ang record ng transaksyon.',
    orderActive: 'Aktibong Order',
    orderActiveMsg: 'May aktibo ka nang hiling para sa serbisyong ito.',
    invalidDeadline: 'Maling Deadline',
    fileTooLarge: 'Masyadong Malaki ang File',
    missingLinks: 'Kulang na Links',
    securityLinks: 'Para sa seguridad, tumatanggap lang kami ng links galing Dropbox o Google Drive.',
  },
};

type Language = 'English' | 'Filipino';

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['English']) => string;
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'English',
  setLanguage: () => { },
  t: (key) => key,
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('English');
  const user = auth.currentUser;

  useEffect(() => {
    const fetchLanguage = async () => {
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('language')
          .eq('firebase_uid', user.uid)
          .single();
        if (data?.language && (data.language === 'English' || data.language === 'Filipino')) {
          setLanguageState(data.language);
        }
      }
    };
    fetchLanguage();
  }, [user]);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    if (user) {
      await supabase.from('users').update({ language: lang }).eq('firebase_uid', user.uid);
    }
  };

  const t = (key: keyof typeof translations['English']) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
