'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import FarmerSidebar from '@/app/navigation/farmer/page';

type Mode = 'quick' | 'request';
type LanguageOption = 'English' | 'Sinhala';
type RequestFilter = 'all' | 'pending' | 'completed' | 'rejected';

interface ImageMetrics {
  brightness: number;
  textureScore: number;
  redMean: number;
  greenMean: number;
  blueMean: number;
  earthyRatio: number;
  centerEarthyRatio: number;
  blueRatio: number;
  greenRatio: number;
  edgeDensity: number;
}

interface SoilRecord {
  _id: string;
  mode: 'image_only' | 'full_fusion';
  district: string;
  location?: string;
  cropType?: string;
  season?: string;
  language?: LanguageOption;
  createdAt: string;
  result: {
    score: number;
    classification: string;
    classificationKey?: string;
    confidence: number;
    soilType: string;
    soilTypeKey?: string;
    agroZone: string;
    agroZoneKey?: string;
    readings: {
      ph: number;
      nitrogen: number;
      phosphorus: number;
      potassium: number;
      moisture: number;
      organicMatter: number;
    };
    levels: Record<string, string>;
    levelsRaw?: Record<string, string>;
    recommendations: string[];
  };
}

interface SoilRequest {
  _id: string;
  district: string;
  location?: string;
  visitAddress?: string;
  addressSource?: 'profile' | 'manual';
  cropType?: string;
  season?: string;
  language?: LanguageOption;
  landSize?: number;
  preferredDate?: string;
  scheduledDate?: string;
  status: string;
  farmerNotes?: string;
  adminNotes?: string;
  assignedAdmin?: {
    name: string;
    phoneNumber?: string;
    email?: string;
  };
  imageAssessment?: {
    score: number;
    classification: string;
    classificationKey?: string;
    confidence: number;
    soilType: string;
  };
  createdAt: string;
}

interface RequestDraft {
  district: string;
  location: string;
  visitAddress: string;
  cropType: string;
  season: string;
  landSize: string;
  preferredDate: string;
  farmerNotes: string;
}

interface PopupState {
  type: 'info' | 'confirm';
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  action?:
    | { kind: 'deleteRequest'; targetId: string }
    | { kind: 'clearRequests' }
    | { kind: 'deleteRecord'; targetId: string }
    | { kind: 'clearHistory' }
    | null;
}

interface SidebarUser {
  id?: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  photoURL?: string;
  address?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
}

const DISTRICTS = [
  'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo', 'Galle', 'Gampaha',
  'Hambantota', 'Jaffna', 'Kalutara', 'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala',
  'Mannar', 'Matale', 'Matara', 'Moneragala', 'Mullaitivu', 'Nuwara Eliya',
  'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya'
];

const SEASONS = ['Maha', 'Yala', 'Inter-monsoon'];

// Each district has its own field-location options for both soil-health flows.
const FIELD_LOCATIONS_BY_DISTRICT: Record<string, string[]> = {
  Ampara: ['Ampara Town', 'Akkaraipattu', 'Kalmunai'],
  Anuradhapura: ['Kekirawa', 'Thalawa', 'Medawachchiya', 'Galenbindunuwewa'],
  Badulla: ['Badulla Town', 'Mahiyanganaya', 'Passara'],
  Batticaloa: ['Batticaloa Town', 'Kattankudy', 'Eravur'],
  Colombo: ['Homagama', 'Kaduwela', 'Hanwella'],
  Galle: ['Galle Town', 'Elpitiya', 'Karandeniya'],
  Gampaha: ['Minuwangoda', 'Divulapitiya', 'Ja-Ela'],
  Hambantota: ['Tissamaharama', 'Ambalantota', 'Tangalle', 'Sooriyawewa'],
  Jaffna: ['Jaffna Town', 'Chavakachcheri', 'Point Pedro'],
  Kalutara: ['Kalutara Town', 'Horana', 'Agalawatta'],
  Kandy: ['Kandy Town', 'Gampola', 'Akurana'],
  Kegalle: ['Kegalle Town', 'Mawanella', 'Rambukkana'],
  Kilinochchi: ['Kilinochchi Town', 'Poonakary', 'Karachchi'],
  Kurunegala: ['Kurunegala Town', 'Kuliyapitiya', 'Nikaweratiya'],
  Mannar: ['Mannar Town', 'Murunkan', 'Nanattan'],
  Matale: ['Matale Town', 'Dambulla', 'Galewela'],
  Matara: ['Matara Town', 'Weligama', 'Akuressa'],
  Moneragala: ['Moneragala Town', 'Wellawaya', 'Bibila'],
  Mullaitivu: ['Mullaitivu Town', 'Oddusuddan', 'Puthukudiyiruppu'],
  'Nuwara Eliya': ['Nuwara Eliya Town', 'Hatton', 'Hanguranketha'],
  Polonnaruwa: ['Polonnaruwa Town', 'Hingurakgoda', 'Medirigiriya'],
  Puttalam: ['Puttalam Town', 'Chilaw', 'Wennappuwa'],
  Ratnapura: ['Ratnapura Town', 'Embilipitiya', 'Balangoda'],
  Trincomalee: ['Trincomalee Town', 'Kinniya', 'Kantale'],
  Vavuniya: ['Vavuniya Town', 'Cheddikulam', 'Vengalacheddikulam']
};

const CROP_TYPES = ['Banana', 'Maize', 'Pumpkin', 'Tomato', 'Chili', 'Onion', 'Potato', 'Brinjal'];

const fieldLocationLabels: Record<LanguageOption, Record<string, string>> = {
  English: {},
  Sinhala: {
    Kekirawa: 'කැකිරාව',
    Tissamaharama: 'තිස්සමහාරාම',
    Ambalantota: 'අම්බලන්තොට',
    Thalawa: 'තලාව',
    Medawachchiya: 'මැදවච්චිය',
    Galenbindunuwewa: 'ගලෙන්බිඳුණුවැව',
    Hingurakgoda: 'හිඟුරක්ගොඩ',
    Mahiyanganaya: 'මහියංගනය',
    Wellawaya: 'වැල්ලවාය',
    Embilipitiya: 'ඇඹිලිපිටිය'
  }
};

const cropTypeLabels: Record<LanguageOption, Record<string, string>> = {
  English: Object.fromEntries(CROP_TYPES.map((crop) => [crop, crop])),
  Sinhala: {
    Banana: 'කෙසෙල්',
    Maize: 'බඩඉරිඟු',
    Pumpkin: 'වට්ටක්කා',
    Tomato: 'තක්කාලි',
    Chili: 'මිරිස්',
    Onion: 'ලූනු',
    Potato: 'අර්තාපල්',
    Brinjal: 'වම්බටු'
  }
};

const districtLabels: Record<LanguageOption, Record<string, string>> = {
  English: {
    Ampara: 'Ampara',
    Anuradhapura: 'Anuradhapura',
    Badulla: 'Badulla',
    Batticaloa: 'Batticaloa',
    Colombo: 'Colombo',
    Galle: 'Galle',
    Gampaha: 'Gampaha',
    Hambantota: 'Hambantota',
    Jaffna: 'Jaffna',
    Kalutara: 'Kalutara',
    Kandy: 'Kandy',
    Kegalle: 'Kegalle',
    Kilinochchi: 'Kilinochchi',
    Kurunegala: 'Kurunegala',
    Mannar: 'Mannar',
    Matale: 'Matale',
    Matara: 'Matara',
    Moneragala: 'Moneragala',
    Mullaitivu: 'Mullaitivu',
    'Nuwara Eliya': 'Nuwara Eliya',
    Polonnaruwa: 'Polonnaruwa',
    Puttalam: 'Puttalam',
    Ratnapura: 'Ratnapura',
    Trincomalee: 'Trincomalee',
    Vavuniya: 'Vavuniya'
  },
  Sinhala: {
    Ampara: 'අම්පාර',
    Anuradhapura: 'අනුරාධපුර',
    Badulla: 'බදුල්ල',
    Batticaloa: 'මඩකලපුව',
    Colombo: 'කොළඹ',
    Galle: 'ගාල්ල',
    Gampaha: 'ගම්පහ',
    Hambantota: 'හම්බන්තොට',
    Jaffna: 'යාපනය',
    Kalutara: 'කළුතර',
    Kandy: 'මහනුවර',
    Kegalle: 'කෑගල්ල',
    Kilinochchi: 'කිලිනොච්චිය',
    Kurunegala: 'කුරුණෑගල',
    Mannar: 'මන්නාරම',
    Matale: 'මාතලේ',
    Matara: 'මාතර',
    Moneragala: 'මොණරාගල',
    Mullaitivu: 'මුලතිව්',
    'Nuwara Eliya': 'නුවරඑළිය',
    Polonnaruwa: 'පොළොන්නරුව',
    Puttalam: 'පුත්තලම',
    Ratnapura: 'රත්නපුර',
    Trincomalee: 'ත්‍රිකුණාමලය',
    Vavuniya: 'වව්නියාව'
  }
};

const seasonLabels: Record<LanguageOption, Record<string, string>> = {
  English: {
    Maha: 'Maha',
    Yala: 'Yala',
    'Inter-monsoon': 'Inter-monsoon'
  },
  Sinhala: {
    Maha: 'මහ',
    Yala: 'යල',
    'Inter-monsoon': 'අතරමැදි වැසි වාරය'
  }
};

const initialForm = {
  district: 'Anuradhapura',
  location: '',
  visitAddress: '',
  cropType: '',
  season: 'Maha',
  language: 'English' as LanguageOption,
  landSize: '1',
  preferredDate: '',
  farmerNotes: ''
};

const initialRequestDraft: RequestDraft = {
  district: 'Anuradhapura',
  location: '',
  visitAddress: '',
  cropType: '',
  season: 'Maha',
  landSize: '1',
  preferredDate: '',
  farmerNotes: ''
};

const uiText = {
  English: {
    moduleTag: 'Soil Health Module',
    title: 'Image-first soil check with admin-assisted sensor support',
    subtitle:
      'Use a soil photo for an instant estimation now, or request a field officer visit for the full fusion result later.',
    workflowTitle: 'Current workflow',
    workflowText: 'Photo upload -> image analysis -> quick score or sensor request',
    quickMode: 'Quick Image Check',
    requestMode: 'Request Sensor Visit',
    district: 'District',
    season: 'Season',
    language: 'Language',
    fieldLocation: 'Field location',
    fieldLocationPlaceholder: 'Select a village or field location',
    visitAddress: 'Visit address',
    visitAddressPlaceholder: 'House number, road, village, and any landmarks',
    visitAddressHint: 'If your farmer profile already has an address, we will use it automatically. You can still replace it here for this request.',
    profileAddressFound: 'Profile address found',
    profileAddressMissing: 'Profile address missing',
    addressRequiredForRequest: 'A visit address is required for sensor visit requests.',
    invalidPhotoTitle: 'Invalid soil photo',
    invalidPhotoMessage:
      'This image does not look like a soil close-up photo. Please upload a clear photo of soil only.',
    nonSoilPopupTitle: 'This is not soil',
    nonSoilPopupMessage: 'Please upload a real soil photo only.',
    undetectedSoilTitle: 'Undetected soil type',
    undetectedSoilMessage: 'This soil photo does not match the 4 supported soil types in the current model.',
    popupOkay: 'Okay',
    popupCancel: 'Cancel',
    popupConfirm: 'Confirm',
    confirmDeleteTitle: 'Delete item?',
    confirmClearTitle: 'Clear all items?',
    cropType: 'Crop type',
    cropTypePlaceholder: 'Select a crop type',
    landSize: 'Land size (acres)',
    preferredVisitDate: 'Preferred visit date',
    soilPhoto: 'Soil photo',
    soilPhotoTitle: 'Upload your soil sample image',
    soilPhotoDescription: 'Choose a clear close-up photo from your phone or computer for a better soil estimate.',
    choosePhoto: 'Choose photo',
    changePhoto: 'Change photo',
    photoReady: 'Photo ready for analysis',
    soilPhotoHint: 'Use a close-up soil photo with natural light and minimal leaves or stones.',
    soilTypesCoverage: 'Quick image check now maps the photo to one of 4 selected Sri Lankan soil groups.',
    requestNote: 'Farmer note for the field officer',
    optionalNote: 'Optional note',
    notePlaceholder: 'Mention field access notes, visible issues, or what you want checked.',
    processing: 'Processing...',
    quickSubmit: 'Run quick image check',
    requestSubmit: 'Submit sensor request',
    imagePreview: 'Image preview',
    previewEmpty: 'Upload a soil image to preview it here',
    brightness: 'Brightness',
    texture: 'Texture',
    rgbMean: 'RGB mean',
    currentMode: 'Current mode',
    imageOnlyEstimate: 'Image-only estimate',
    fusionRequest: 'Admin-assisted fusion request',
    latestResult: 'Latest result',
    soilHealthScore: 'Soil health score',
    confidence: 'Confidence',
    recommendations: 'Recommendations',
    mySensorRequests: 'My sensor requests',
    requestAll: 'All',
    requestView: 'View',
    requestEdit: 'Edit',
    requestSave: 'Save changes',
    requestCancel: 'Cancel',
    clearRequests: 'Clear all',
    clearRequestsConfirm: 'Are you sure you want to clear all sensor requests?',
    deleteRequest: 'Delete',
    deleteRequestConfirm: 'Delete this sensor request?',
    requestDeleted: 'Sensor request deleted.',
    requestsCleared: 'All sensor requests cleared.',
    requestUpdated: 'Sensor request updated.',
    requestDetails: 'Request details',
    requestSummary: 'Request summary',
    requestTimeline: 'Request timeline',
    requestCreated: 'Created',
    requestUpdatedLabel: 'Last update',
    requestStatus: 'Status',
    requestPreviewTitle: 'Sensor request preview',
    pendingOnlyEdit: 'Only pending requests can be edited.',
    requestEmptyState: 'Select a request to view the full details.',
    requestNoteLabel: 'Farmer note',
    requestEditHint: 'You can edit pending requests before the admin confirms them.',
    noRequests:
      'No sensor requests yet. Submit one when you want a field officer to collect pH and NPK readings.',
    preferredDate: 'Preferred date',
    scheduledDate: 'Scheduled date',
    previewScore: 'Preview score',
    assignedAdmin: 'Assigned admin',
    notSet: 'Not set',
    pending: 'Pending',
    notAssignedYet: 'Not assigned yet',
    adminNote: 'Admin note',
    assessmentHistory: 'Assessment history',
    clearHistory: 'Clear history',
    clearHistoryConfirm: 'Are you sure you want to clear all assessment history?',
    deleteItem: 'Delete',
    deleteItemConfirm: 'Delete this assessment history item?',
    preview: 'Preview',
    closePreview: 'Close preview',
    downloadReport: 'Download report',
    historyCleared: 'Assessment history cleared.',
    historyItemDeleted: 'Assessment history item deleted.',
    detailedPreview: 'Detailed preview',
    reportGenerated: 'Generated report',
    agroZone: 'Agro zone',
    noHistory: 'Your completed soil assessments will appear here.',
    generalFieldCheck: 'General field check',
    generalCheck: 'General check',
    fullFusion: 'Full fusion',
    imageOnly: 'Image only',
    uploadFirst: 'Please upload a soil photo first.',
    signInAgain: 'Please sign in again.',
    signInToLoad: 'Please sign in again to load soil-health history.',
    loadFailed: 'Could not load soil-health data.',
    backendUnavailable: 'Could not load soil-health history because the backend server is unavailable.',
    imagePreviewFailed: 'Image analysis preview failed. Please try another photo.',
    requestFailed: 'Request failed.',
    somethingWentWrong: 'Something went wrong.',
    ph: 'pH',
    nitrogen: 'Nitrogen',
    phosphorus: 'Phosphorus',
    potassium: 'Potassium',
    moisture: 'Moisture',
    organicMatter: 'Organic matter',
    soilType: 'Soil type',
    english: 'English',
    sinhala: 'Sinhala'
  },
  Sinhala: {
    moduleTag: 'පස් සෞඛ්‍ය මොඩියුලය',
    title: 'ඡායාරූපයෙන් ආරම්භ වන පස් පරීක්ෂාව සහ නිලධාරී සංවේදක සහාය',
    subtitle:
      'දැන්ම පසේ ඡායාරූපයක් භාවිතා කර ඉක්මන් ඇස්තමේන්තුවක් ලබාගන්න, නැත්නම් පසුව පූර්ණ විශ්ලේෂණය සඳහා ක්ෂේත්‍ර නිලධාරී සංචාරයක් ඉල්ලන්න.',
    workflowTitle: 'දැනට ක්‍රියාදාමය',
    workflowText: 'ඡායාරූපය upload කිරීම -> image analysis -> quick score හෝ sensor request',
    quickMode: 'ඉක්මන් ඡායාරූප පරීක්ෂාව',
    requestMode: 'සංවේදක සංචාරයක් ඉල්ලන්න',
    district: 'දිස්ත්‍රික්කය',
    season: 'වාරය',
    language: 'භාෂාව',
    fieldLocation: 'ඉඩමේ ස්ථානය',
    fieldLocationPlaceholder: 'ගම හෝ ඉඩමේ ස්ථානය තෝරන්න',
    visitAddress: 'සංචාර ලිපිනය',
    visitAddressPlaceholder: 'ගෙදර අංකය, පාර, ගම සහ හඳුනාගැනීමට උපකාරී ලකුණු',
    visitAddressHint: 'ඔබගේ farmer profile එකේ address එක තිබ්බොත් ඒක auto use කරනවා. ඕන නම් මේ request එකට වෙනම address එකක් මෙතන දාන්නත් පුළුවන්.',
    profileAddressFound: 'Profile address එක ලැබුණා',
    profileAddressMissing: 'Profile address එක නෑ',
    addressRequiredForRequest: 'Sensor visit request එකක් සඳහා සංචාර ලිපිනය අනිවාර්යයි.',
    invalidPhotoTitle: 'වලංගු නොවන පස් ඡායාරූපය',
    invalidPhotoMessage:
      'මේ image එක පස් close-up photo එකක් වගේ පේන්නේ නැහැ. කරුණාකර පස පමණක් පේන පැහැදිලි ඡායාරූපයක් upload කරන්න.',
    nonSoilPopupTitle: 'මේක පස් නෙවෙයි',
    nonSoilPopupMessage: 'කරුණාකර සත්‍ය පස් ඡායාරූපයක් පමණක් upload කරන්න.',
    undetectedSoilTitle: 'පස් වර්ගය හඳුනාගත නොහැක',
    undetectedSoilMessage: 'මේ පස් ඡායාරූපය current model එකේ support කරන පස් වර්ග 4ට ගැළපෙන්නේ නැහැ.',
    popupOkay: 'හරි',
    popupCancel: 'අවලංගු කරන්න',
    popupConfirm: 'තහවුරු කරන්න',
    confirmDeleteTitle: 'item එක මකන්නද?',
    confirmClearTitle: 'සියල්ල මකන්නද?',
    cropType: 'වගා වර්ගය',
    cropTypePlaceholder: 'වගා වර්ගයක් තෝරන්න',
    landSize: 'ඉඩම් ප්‍රමාණය (අක්කර)',
    preferredVisitDate: 'අවශ්‍ය සංචාර දිනය',
    soilPhoto: 'පස් ඡායාරූපය',
    soilPhotoTitle: 'ඔබගේ පස් sample ඡායාරූපය upload කරන්න',
    soilPhotoDescription: 'හොඳ soil estimate එකක් සඳහා phone එකෙන් හෝ computer එකෙන් පැහැදිලි close-up photo එකක් තෝරන්න.',
    choosePhoto: 'ඡායාරූපය තෝරන්න',
    changePhoto: 'ඡායාරූපය වෙනස් කරන්න',
    photoReady: 'ඡායාරූපය analysis සඳහා සූදානම්',
    soilPhotoHint: 'ස්වභාවික ආලෝකයේ, කොළ හෝ ගල් අඩුවෙන් පෙනෙන පසේ close-up photo එකක් භාවිතා කරන්න.',
    soilTypesCoverage: 'ඉක්මන් image check එක දැන් තෝරාගත් ශ්‍රී ලංකා පස් වර්ග 4න් එකකට photo එක map කරයි.',
    requestNote: 'ක්ෂේත්‍ර නිලධාරියාට සටහන',
    optionalNote: 'විකල්ප සටහන',
    notePlaceholder: 'ඉඩමට ඇතුල්වන ආකාරය, පෙනෙන ගැටලු, හෝ පරීක්ෂා කළ යුතු දේ සඳහන් කරන්න.',
    processing: 'සැකසෙමින්...',
    quickSubmit: 'ඉක්මන් පරීක්ෂාව ක්‍රියාත්මක කරන්න',
    requestSubmit: 'සංවේදක ඉල්ලීම යවන්න',
    imagePreview: 'ඡායාරූප පෙරදසුන',
    previewEmpty: 'මෙතැන පෙරදසුන බලන්න පස් ඡායාරූපයක් upload කරන්න',
    brightness: 'දීප්තිය',
    texture: 'රුව / texture',
    rgbMean: 'RGB සාමාන්‍යය',
    currentMode: 'දැනට mode එක',
    imageOnlyEstimate: 'ඡායාරූප මත පමණක් ඇස්තමේන්තුව',
    fusionRequest: 'නිලධාරී සහාය ඇති fusion request',
    latestResult: 'අලුත්ම ප්‍රතිඵලය',
    soilHealthScore: 'පස් සෞඛ්‍ය ලකුණ',
    confidence: 'විශ්වාස මට්ටම',
    recommendations: 'නිර්දේශ',
    mySensorRequests: 'මගේ සංවේදක ඉල්ලීම්',
    requestAll: 'සියල්ල',
    requestView: 'බලන්න',
    requestEdit: 'සංස්කරණය',
    requestSave: 'වෙනස්කම් සුරකින්න',
    requestCancel: 'අවලංගු කරන්න',
    clearRequests: 'සියල්ල මකන්න',
    clearRequestsConfirm: 'සියලුම සංවේදක ඉල්ලීම් මකන්න ඕනේද?',
    deleteRequest: 'මකන්න',
    deleteRequestConfirm: 'මේ සංවේදක ඉල්ලීම මකන්නද?',
    requestDeleted: 'සංවේදක ඉල්ලීම මකා දමා ඇත.',
    requestsCleared: 'සියලුම සංවේදක ඉල්ලීම් මකා දමා ඇත.',
    requestUpdated: 'සංවේදක ඉල්ලීම යාවත්කාලීන කළා.',
    requestDetails: 'ඉල්ලීමේ විස්තර',
    requestSummary: 'ඉල්ලීමේ සාරාංශය',
    requestTimeline: 'ඉල්ලීමේ කාලරේඛාව',
    requestCreated: 'සාදන ලද්දේ',
    requestUpdatedLabel: 'අවසන් යාවත්කාලීනය',
    requestStatus: 'තත්වය',
    requestPreviewTitle: 'සංවේදක ඉල්ලීමේ පෙරදසුන',
    pendingOnlyEdit: 'සංස්කරණය කළ හැක්කේ pending ඉල්ලීම් පමණි.',
    requestEmptyState: 'සම්පූර්ණ විස්තර බැලීමට ඉල්ලීමක් තෝරන්න.',
    requestNoteLabel: 'ගොවි සටහන',
    requestEditHint: 'admin තහවුරු කිරීමට පෙර pending ඉල්ලීම් වෙනස් කළ හැක.',
    noRequests:
      'තවම සංවේදක ඉල්ලීම් නැහැ. pH සහ NPK දත්ත ලබාගැනීමට ක්ෂේත්‍ර නිලධාරියෙකුගේ සංචාරයක් ඉල්ලන්න.',
    preferredDate: 'අවශ්‍ය දිනය',
    scheduledDate: 'නියමිත දිනය',
    previewScore: 'පෙරදසුන් ලකුණ',
    assignedAdmin: 'පවරා ඇති නිලධාරියා',
    notSet: 'සැකසී නැහැ',
    pending: 'පොරොත්තුවේ',
    notAssignedYet: 'තවම පවරලා නැහැ',
    adminNote: 'නිලධාරී සටහන',
    assessmentHistory: 'පරීක්ෂණ ඉතිහාසය',
    clearHistory: 'ඉතිහාසය මකන්න',
    clearHistoryConfirm: 'සියලුම assessment history මකන්න ඕනේද?',
    deleteItem: 'මකන්න',
    deleteItemConfirm: 'මේ assessment history item එක මකන්නද?',
    preview: 'පෙරදසුන',
    closePreview: 'පෙරදසුන වසන්න',
    downloadReport: 'වාර්තාව download කරන්න',
    historyCleared: 'assessment history මකා දමා ඇත.',
    historyItemDeleted: 'assessment history item මකා දමා ඇත.',
    detailedPreview: 'විස්තරාත්මක පෙරදසුන',
    reportGenerated: 'සාදන ලද වාර්තාව',
    agroZone: 'කෘෂි කලාපය',
    noHistory: 'ඔබේ සම්පූර්ණ පස් පරීක්ෂණ මෙතැන දිස්වේ.',
    generalFieldCheck: 'සාමාන්‍ය ඉඩම් පරීක්ෂාව',
    generalCheck: 'සාමාන්‍ය පරීක්ෂාව',
    fullFusion: 'පූර්ණ fusion',
    imageOnly: 'ඡායාරූප පමණි',
    uploadFirst: 'මුලින්ම පස් ඡායාරූපයක් upload කරන්න.',
    signInAgain: 'කරුණාකර නැවත sign in කරන්න.',
    signInToLoad: 'පස් සෞඛ්‍ය දත්ත load කිරීමට නැවත sign in කරන්න.',
    loadFailed: 'පස් සෞඛ්‍ය දත්ත load කළ නොහැකි විය.',
    backendUnavailable: 'backend server එක සම්බන්ධ නොවූ නිසා පස් සෞඛ්‍ය ඉතිහාසය load කළ නොහැකි විය.',
    imagePreviewFailed: 'ඡායාරූප preview analysis අසාර්ථකයි. වෙනත් photo එකක් උත්සාහ කරන්න.',
    requestFailed: 'ඉල්ලීම අසාර්ථකයි.',
    somethingWentWrong: 'යම් දෝෂයක් සිදු විය.',
    ph: 'pH',
    nitrogen: 'නයිට්‍රජන්',
    phosphorus: 'පොස්පරස්',
    potassium: 'පොටෑසියම්',
    moisture: 'තෙතමනය',
    organicMatter: 'සජීව ද්‍රව්‍ය',
    soilType: 'පස් වර්ගය',
    english: 'English',
    sinhala: 'සිංහල'
  }
} as const;

const readingLabelKeyMap: Record<keyof SoilRecord['result']['readings'], keyof typeof uiText.English> = {
  ph: 'ph',
  nitrogen: 'nitrogen',
  phosphorus: 'phosphorus',
  potassium: 'potassium',
  moisture: 'moisture',
  organicMatter: 'organicMatter'
};

function getStatusClasses(status: string) {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'approved':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'rejected':
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return 'bg-amber-100 text-amber-700 border-amber-200';
  }
}

function getScoreClasses(classification?: string, classificationKey?: string) {
  const value = classificationKey || classification;

  switch (value) {
    case 'Excellent':
    case 'විශිෂ්ටයි':
      return 'text-green-700 bg-green-100 border-green-200';
    case 'Good':
    case 'හොඳයි':
      return 'text-sky-700 bg-sky-100 border-sky-200';
    case 'Fair':
    case 'මධ්‍යස්ථයි':
      return 'text-amber-700 bg-amber-100 border-amber-200';
    default:
      return 'text-red-700 bg-red-100 border-red-200';
  }
}

function getLocalizedStatus(status: string, language: LanguageOption) {
  if (language === 'Sinhala') {
    if (status === 'completed') return 'සම්පූර්ණයි';
    if (status === 'approved') return 'අනුමතයි';
    if (status === 'rejected') return 'ප්‍රතික්ෂේපයි';
    return 'පොරොත්තුවේ';
  }

  if (status === 'completed') return 'Completed';
  if (status === 'approved') return 'Approved';
  if (status === 'rejected') return 'Rejected';
  return 'Pending';
}

function matchesRequestFilter(status: string, filter: RequestFilter) {
  if (filter === 'all') return true;
  if (filter === 'pending') return status === 'pending' || status === 'approved';
  return status === filter;
}

function buildProfileAddress(user: SidebarUser | null) {
  if (!user) return '';

  return [
    user.address,
    user.addressLine2,
    user.city,
    user.state,
    user.country,
    user.zipCode
  ]
    .filter(Boolean)
    .join(', ')
    .trim();
}

function rgbToHsv(red: number, green: number, blue: number) {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let hue = 0;
  if (delta !== 0) {
    if (max === r) {
      hue = 60 * (((g - b) / delta) % 6);
    } else if (max === g) {
      hue = 60 * ((b - r) / delta + 2);
    } else {
      hue = 60 * ((r - g) / delta + 4);
    }
  }

  if (hue < 0) {
    hue += 360;
  }

  const saturation = max === 0 ? 0 : delta / max;
  const value = max;

  return { hue, saturation, value };
}

function isLikelySoilPhoto(imageMetrics: ImageMetrics) {
  const {
    brightness,
    textureScore,
    redMean,
    greenMean,
    blueMean,
    earthyRatio,
    centerEarthyRatio,
    blueRatio,
    greenRatio,
    edgeDensity
  } = imageMetrics;
  const channelSpread = Math.max(redMean, greenMean, blueMean) - Math.min(redMean, greenMean, blueMean);

  const strongSoilSignature =
    earthyRatio >= 0.26 &&
    centerEarthyRatio >= 0.3 &&
    textureScore >= 18 &&
    edgeDensity >= 0.07 &&
    redMean >= blueMean - 8;

  const hasEarthDominance = earthyRatio >= 0.24;
  const hasLowBlueScene = blueRatio <= 0.18;
  const hasLowVegetation = greenRatio <= 0.22;
  const hasCloseTexture = textureScore >= 18 && edgeDensity >= 0.07;
  const hasBalancedLight = brightness >= 35 && brightness <= 205;
  const hasBalancedChannels = channelSpread <= 118 && redMean >= blueMean - 8;
  const hasSoilCenteredFrame = centerEarthyRatio >= 0.3;
  const looksLikeWideScene =
    (
      (blueRatio > 0.16 && centerEarthyRatio < 0.24) ||
      (greenRatio > 0.2 && centerEarthyRatio < 0.24) ||
      centerEarthyRatio < 0.16 ||
      (textureScore > 55 && blueMean >= redMean && earthyRatio < 0.24)
    ) && !strongSoilSignature;

  const checks = [
    hasEarthDominance,
    hasSoilCenteredFrame,
    hasLowBlueScene,
    hasLowVegetation,
    hasCloseTexture,
    hasBalancedLight,
    hasBalancedChannels
  ];
  const passedChecks = checks.filter(Boolean).length;

  if (looksLikeWideScene) {
    return false;
  }

  return strongSoilSignature || (passedChecks >= 5 && hasEarthDominance && hasCloseTexture && hasSoilCenteredFrame);
}

function seedRequestDraft(request: SoilRequest): RequestDraft {
  return {
    district: request.district,
    location: request.location || '',
    visitAddress: request.visitAddress || '',
    cropType: request.cropType || '',
    season: request.season || 'Maha',
    landSize: String(request.landSize ?? 1),
    preferredDate: request.preferredDate ? request.preferredDate.slice(0, 10) : '',
    farmerNotes: request.farmerNotes || ''
  };
}

function getDistrictLabel(district: string, language: LanguageOption) {
  return districtLabels[language][district] || district;
}

function getSeasonLabel(season: string, language: LanguageOption) {
  return seasonLabels[language][season] || season;
}

async function extractImageMetrics(file: File): Promise<ImageMetrics> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas is not available in this browser.');
  }

  canvas.width = 224;
  canvas.height = 224;
  ctx.drawImage(image, 0, 0, 224, 224);
  const { data } = ctx.getImageData(0, 0, 224, 224);

  let r = 0;
  let g = 0;
  let b = 0;
  let brightness = 0;
  let earthyPixels = 0;
  let centerEarthyPixels = 0;
  let centerPixels = 0;
  let bluePixels = 0;
  let greenPixels = 0;
  let edgePixels = 0;
  const brightnessValues: number[] = [];
  const brightnessGrid: number[] = new Array(224 * 224).fill(0);

  for (let y = 0; y < 224; y += 1) {
    for (let x = 0; x < 224; x += 1) {
      const pixelIndex = y * 224 + x;
      const i = pixelIndex * 4;
      const red = data[i];
      const green = data[i + 1];
      const blue = data[i + 2];
      const pixelBrightness = 0.299 * red + 0.587 * green + 0.114 * blue;
      const { hue, saturation, value } = rgbToHsv(red, green, blue);

      const isEarthTone =
        ((hue >= 8 && hue <= 55 && saturation >= 0.14 && saturation <= 0.78 && value >= 0.14 && value <= 0.88) ||
          (saturation <= 0.24 && value >= 0.16 && value <= 0.72));
      const isBlueScene = hue >= 185 && hue <= 260 && saturation >= 0.18 && value >= 0.22;
      const isGreenScene = hue >= 70 && hue <= 170 && saturation >= 0.18 && value >= 0.18;
      const isCenterRegion = x >= 56 && x < 168 && y >= 56 && y < 168;

      r += red;
      g += green;
      b += blue;
      brightness += pixelBrightness;
      brightnessValues.push(pixelBrightness);
      brightnessGrid[pixelIndex] = pixelBrightness;

      if (isEarthTone) earthyPixels += 1;
      if (isCenterRegion) {
        centerPixels += 1;
        if (isEarthTone) {
          centerEarthyPixels += 1;
        }
      }
      if (isBlueScene) bluePixels += 1;
      if (isGreenScene) greenPixels += 1;
    }
  }

  const totalPixels = brightnessValues.length || 1;
  const avgBrightness = brightness / totalPixels;
  const variance =
    brightnessValues.reduce((sum, value) => sum + (value - avgBrightness) ** 2, 0) / totalPixels;

  for (let y = 0; y < 223; y += 1) {
    for (let x = 0; x < 223; x += 1) {
      const current = brightnessGrid[y * 224 + x];
      const right = brightnessGrid[y * 224 + (x + 1)];
      const down = brightnessGrid[(y + 1) * 224 + x];

      if (Math.abs(current - right) > 18 || Math.abs(current - down) > 18) {
        edgePixels += 1;
      }
    }
  }

  return {
    brightness: Number(avgBrightness.toFixed(2)),
    textureScore: Number(Math.min(100, Math.sqrt(variance)).toFixed(2)),
    redMean: Number((r / totalPixels).toFixed(2)),
    greenMean: Number((g / totalPixels).toFixed(2)),
    blueMean: Number((b / totalPixels).toFixed(2)),
    earthyRatio: Number((earthyPixels / totalPixels).toFixed(4)),
    centerEarthyRatio: Number((centerEarthyPixels / Math.max(centerPixels, 1)).toFixed(4)),
    blueRatio: Number((bluePixels / totalPixels).toFixed(4)),
    greenRatio: Number((greenPixels / totalPixels).toFixed(4)),
    edgeDensity: Number((edgePixels / totalPixels).toFixed(4))
  };
}

async function createResizedImageDataUrl(file: File): Promise<string> {
  const originalDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = originalDataUrl;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas is not available in this browser.');
  }

  canvas.width = 640;
  canvas.height = 640;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 640, 640);

  const scale = Math.min(640 / image.width, 640 / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  const offsetX = (640 - width) / 2;
  const offsetY = (640 - height) / 2;
  ctx.drawImage(image, offsetX, offsetY, width, height);

  return canvas.toDataURL('image/jpeg', 0.78);
}

export default function SoilHealthPage() {
  const [user, setUser] = useState<SidebarUser | null>(null);
  const [form, setForm] = useState(initialForm);
  const [mode, setMode] = useState<Mode>('quick');
  const [imageMetrics, setImageMetrics] = useState<ImageMetrics | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState('');
  const [metricsPreview, setMetricsPreview] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<SoilRecord[]>([]);
  const [requests, setRequests] = useState<SoilRequest[]>([]);
  const [latestResult, setLatestResult] = useState<SoilRecord | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<SoilRecord | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<SoilRequest | null>(null);
  const [requestDraft, setRequestDraft] = useState<RequestDraft>(initialRequestDraft);
  const [requestFilter, setRequestFilter] = useState<RequestFilter>('all');
  const [requestEditMode, setRequestEditMode] = useState(false);
  const [historyActionLoading, setHistoryActionLoading] = useState<string | null>(null);
  const [requestActionLoading, setRequestActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isPreviewScrolling, setIsPreviewScrolling] = useState(false);
  const [isRequestPreviewScrolling, setIsRequestPreviewScrolling] = useState(false);
  const [popup, setPopup] = useState<PopupState | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const token = useMemo(() => (typeof window !== 'undefined' ? localStorage.getItem('token') : null), []);
  const t = uiText[form.language];
  const profileAddress = useMemo(() => buildProfileAddress(user), [user]);
  const filteredRequests = useMemo(
    () => requests.filter((request) => matchesRequestFilter(request.status, requestFilter)),
    [requestFilter, requests]
  );

  const loadData = useCallback(async () => {
    if (!token) {
      setError(t.signInToLoad);
      return;
    }

    try {
      const [historyRes, requestsRes] = await Promise.all([
        fetch(`${API_URL}/soil-health/history`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/soil-health/requests/my`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (!historyRes.ok || !requestsRes.ok) {
        throw new Error(t.backendUnavailable);
      }

      const historyData = await historyRes.json();
      const requestsData = await requestsRes.json();

      if (historyData.success) {
        setHistory(historyData.data);
      }
      if (requestsData.success) {
        setRequests(requestsData.data);
        setSelectedRequest((current) => {
          if (!current) {
            return null;
          }

          const refreshed = requestsData.data.find((request: SoilRequest) => request._id === current._id) || null;
          if (refreshed) {
            setRequestDraft(seedRequestDraft(refreshed));
          } else {
            setRequestEditMode(false);
          }
          return refreshed;
        });
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t.loadFailed);
    }
  }, [API_URL, t.backendUnavailable, t.loadFailed, t.signInToLoad, token]);

  const showInfoPopup = useCallback((title: string, message: string) => {
    setPopup({
      type: 'info',
      title,
      message,
      confirmLabel: t.popupOkay,
      action: null
    });
  }, [t.popupOkay]);

  const showConfirmPopup = useCallback(
    (title: string, message: string, action: NonNullable<PopupState['action']>, confirmLabel?: string) => {
      setPopup({
        type: 'confirm',
        title,
        message,
        confirmLabel: confirmLabel || t.popupConfirm,
        cancelLabel: t.popupCancel,
        action
      });
    },
    [t.popupCancel, t.popupConfirm]
  );

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser) as SidebarUser;
      setUser(parsedUser);

      const storedAddress = buildProfileAddress(parsedUser);
      if (storedAddress) {
        setForm((current) => (current.visitAddress ? current : { ...current, visitAddress: storedAddress }));
      }

      if (token && parsedUser.id) {
        void (async () => {
          try {
            const response = await fetch(`${API_URL}/users/${parsedUser.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) {
              return;
            }

            const latestUser = await response.json();
            setUser((current) => ({ ...current, ...latestUser }));

            const latestAddress = buildProfileAddress(latestUser);
            if (latestAddress) {
              setForm((current) => (current.visitAddress ? current : { ...current, visitAddress: latestAddress }));
            }
          } catch {
            // Keep local profile data when the live profile request is unavailable.
          }
        })();
      }
    }

    if (token) {
      void loadData();
    }
  }, [API_URL, loadData, token]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError('');
    setNotice('');
    setLatestResult(null);

    if (!file) {
      setImageMetrics(null);
      setImageDataUrl('');
      setMetricsPreview('');
      return;
    }

    try {
      const dataUrl = await createResizedImageDataUrl(file);
      const metrics = await extractImageMetrics(file);
      setImageDataUrl(dataUrl);
      setMetricsPreview(URL.createObjectURL(file));
      setImageMetrics(metrics);
    } catch {
      setError(t.imagePreviewFailed);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!token) {
      setError(t.signInAgain);
      return;
    }

    if (mode === 'request' && !(form.visitAddress.trim() || profileAddress)) {
      setError(t.addressRequiredForRequest);
      return;
    }

    if (!imageMetrics) {
      setError(t.uploadFirst);
      return;
    }

    setSubmitting(true);
    setError('');
    setNotice('');

    const payload = {
      district: form.district,
      location: form.location,
      visitAddress: mode === 'request' ? form.visitAddress.trim() || profileAddress : undefined,
      cropType: form.cropType,
      season: form.season,
      language: form.language,
      landSize: Number(form.landSize),
      preferredDate: form.preferredDate || undefined,
      farmerNotes: form.farmerNotes,
      imageMetrics,
      imageBase64: imageDataUrl || undefined
    };

    try {
      const endpoint = mode === 'quick' ? 'analyze-image' : 'requests';
      const response = await fetch(`${API_URL}/soil-health/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || t.requestFailed);
      }

      if (mode === 'quick') {
        setLatestResult(result.data);
      }

      await loadData();
    } catch (submitError: unknown) {
      const message = submitError instanceof Error ? submitError.message : t.somethingWentWrong;
      setLatestResult(null);
      setError(message);
      if (message.includes('valid close-up soil photo') || message.includes('does not appear to be a valid') || message.includes('This is not soil')) {
        showInfoPopup(t.nonSoilPopupTitle, t.nonSoilPopupMessage);
      } else if (message.includes('does not match the 4 supported soil groups') || message.includes('Undetected soil type')) {
        showInfoPopup(t.undetectedSoilTitle, t.undetectedSoilMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const openRequestPreview = (request: SoilRequest) => {
    setSelectedRequest(request);
    setRequestDraft(seedRequestDraft(request));
    setRequestEditMode(false);
    setError('');
    setNotice('');
  };

  useEffect(() => {
    if (!selectedRecord) {
      setIsPreviewScrolling(false);
      return undefined;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const handleWindowWheel = () => {
      setIsPreviewScrolling(true);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => setIsPreviewScrolling(false), 700);
    };

    window.addEventListener('wheel', handleWindowWheel, { passive: true });
    window.addEventListener('touchmove', handleWindowWheel, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWindowWheel);
      window.removeEventListener('touchmove', handleWindowWheel);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [selectedRecord]);

  useEffect(() => {
    if (!selectedRequest) {
      setIsRequestPreviewScrolling(false);
      setRequestEditMode(false);
      return undefined;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const handleWindowWheel = () => {
      setIsRequestPreviewScrolling(true);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => setIsRequestPreviewScrolling(false), 700);
    };

    window.addEventListener('wheel', handleWindowWheel, { passive: true });
    window.addEventListener('touchmove', handleWindowWheel, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWindowWheel);
      window.removeEventListener('touchmove', handleWindowWheel);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [selectedRequest]);

  const handleUpdateRequest = async () => {
    if (!token || !selectedRequest) {
      return;
    }

    if (selectedRequest.status !== 'pending') {
      setNotice('');
      setError(t.pendingOnlyEdit);
      return;
    }

    try {
      setRequestActionLoading(selectedRequest._id);
      setError('');
      setNotice('');

      const response = await fetch(`${API_URL}/soil-health/requests/${selectedRequest._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...requestDraft,
          visitAddress: requestDraft.visitAddress.trim() || profileAddress,
          language: form.language,
          landSize: Number(requestDraft.landSize)
        })
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || t.requestFailed);
      }

      setSelectedRequest(result.data);
      setRequestDraft(seedRequestDraft(result.data));
      setRequestEditMode(false);
      setNotice(t.requestUpdated);
      await loadData();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : t.somethingWentWrong);
    } finally {
      setRequestActionLoading(null);
    }
  };

  const executeDeleteRequest = async (requestId: string) => {
    if (!token) {
      return;
    }

    try {
      setRequestActionLoading(requestId);
      setError('');
      setNotice('');
      const response = await fetch(`${API_URL}/soil-health/requests/${requestId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || t.requestFailed);
      }

      setRequests((current) => current.filter((request) => request._id !== requestId));
      if (selectedRequest?._id === requestId) {
        setSelectedRequest(null);
        setRequestEditMode(false);
      }
      setNotice(t.requestDeleted);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : t.somethingWentWrong);
    } finally {
      setRequestActionLoading(null);
    }
  };

  const executeClearRequests = async () => {
    if (!token || requests.length === 0) {
      return;
    }

    try {
      setRequestActionLoading('all');
      setError('');
      setNotice('');
      const response = await fetch(`${API_URL}/soil-health/requests`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || t.requestFailed);
      }

      setRequests([]);
      setSelectedRequest(null);
      setRequestEditMode(false);
      setNotice(t.requestsCleared);
    } catch (clearError) {
      setError(clearError instanceof Error ? clearError.message : t.somethingWentWrong);
    } finally {
      setRequestActionLoading(null);
    }
  };

  const executeDeleteRecord = async (recordId: string) => {
    if (!token) {
      return;
    }

    try {
      setHistoryActionLoading(recordId);
      setError('');
      const response = await fetch(`${API_URL}/soil-health/history/${recordId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || t.requestFailed);
      }

      setHistory((current) => current.filter((record) => record._id !== recordId));
      if (latestResult?._id === recordId) {
        setLatestResult(null);
      }
      if (selectedRecord?._id === recordId) {
        setSelectedRecord(null);
      }
      setNotice(t.historyItemDeleted);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : t.somethingWentWrong);
    } finally {
      setHistoryActionLoading(null);
    }
  };

  const executeClearHistory = async () => {
    if (!token || history.length === 0) {
      return;
    }

    try {
      setHistoryActionLoading('all');
      setError('');
      const response = await fetch(`${API_URL}/soil-health/history`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || t.requestFailed);
      }

      setHistory([]);
      setLatestResult(null);
      setSelectedRecord(null);
      setNotice(t.historyCleared);
    } catch (clearError) {
      setError(clearError instanceof Error ? clearError.message : t.somethingWentWrong);
    } finally {
      setHistoryActionLoading(null);
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    showConfirmPopup(t.confirmDeleteTitle, t.deleteRequestConfirm, { kind: 'deleteRequest', targetId: requestId }, t.deleteRequest);
  };

  const handleClearRequests = async () => {
    if (requests.length === 0) return;
    showConfirmPopup(t.confirmClearTitle, t.clearRequestsConfirm, { kind: 'clearRequests' }, t.clearRequests);
  };

  const handleDeleteRecord = async (recordId: string) => {
    showConfirmPopup(t.confirmDeleteTitle, t.deleteItemConfirm, { kind: 'deleteRecord', targetId: recordId }, t.deleteItem);
  };

  const handleClearHistory = async () => {
    if (history.length === 0) return;
    showConfirmPopup(t.confirmClearTitle, t.clearHistoryConfirm, { kind: 'clearHistory' }, t.clearHistory);
  };

  const handlePopupConfirm = async () => {
    if (!popup?.action) {
      setPopup(null);
      return;
    }

    const currentAction = popup.action;
    setPopup(null);

    if (currentAction.kind === 'deleteRequest') {
      await executeDeleteRequest(currentAction.targetId);
      return;
    }
    if (currentAction.kind === 'clearRequests') {
      await executeClearRequests();
      return;
    }
    if (currentAction.kind === 'deleteRecord') {
      await executeDeleteRecord(currentAction.targetId);
      return;
    }
    if (currentAction.kind === 'clearHistory') {
      await executeClearHistory();
    }
  };

  const downloadReport = (record: SoilRecord) => {
    const reportLanguage = record.language || form.language;
    const labels = uiText[reportLanguage];
    const reportHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>${labels.reportGenerated}</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: Arial, sans-serif;
        background: linear-gradient(180deg, #f5f7f4 0%, #eefbf2 100%);
        color: #1c1917;
        padding: 28px;
      }
      .page {
        max-width: 960px;
        margin: 0 auto;
      }
      .hero {
        background: linear-gradient(135deg, #0f172a 0%, #1f2937 58%, #166534 120%);
        color: #ffffff;
        border-radius: 28px;
        padding: 28px;
        box-shadow: 0 28px 60px -36px rgba(15, 23, 42, 0.55);
      }
      .hero-top {
        display: flex;
        justify-content: space-between;
        gap: 20px;
        align-items: flex-start;
      }
      .eyebrow {
        font-size: 12px;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: rgba(220, 252, 231, 0.92);
        margin: 0 0 12px;
        font-weight: 700;
      }
      h1, h2, h3, p {
        margin: 0;
      }
      .hero h1 {
        font-size: 30px;
        line-height: 1.15;
        margin-bottom: 8px;
      }
      .hero-subtitle {
        color: rgba(226, 232, 240, 0.92);
        line-height: 1.6;
        max-width: 580px;
      }
      .score-box {
        min-width: 220px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 22px;
        padding: 20px;
      }
      .score-label {
        font-size: 12px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: rgba(220, 252, 231, 0.9);
      }
      .score-value {
        font-size: 58px;
        font-weight: 800;
        margin-top: 8px;
        line-height: 1;
      }
      .pill {
        display: inline-block;
        margin-top: 12px;
        padding: 7px 14px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.14);
        border: 1px solid rgba(255, 255, 255, 0.14);
        color: #ffffff;
        font-weight: 700;
      }
      .hero-meta {
        margin-top: 12px;
        font-size: 14px;
        color: rgba(226, 232, 240, 0.92);
      }
      .section {
        margin-top: 22px;
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid #d6f0dd;
        border-radius: 24px;
        padding: 22px;
        box-shadow: 0 20px 40px -34px rgba(22, 101, 52, 0.25);
      }
      .section-title {
        font-size: 13px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: #15803d;
        font-weight: 700;
        margin-bottom: 14px;
      }
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
      }
      .summary-card {
        background: linear-gradient(180deg, #fafaf9, #ffffff);
        border: 1px solid #e7e5e4;
        border-radius: 18px;
        padding: 16px;
      }
      .summary-card .label {
        font-size: 12px;
        color: #57534e;
        margin-bottom: 6px;
      }
      .summary-card .value {
        font-size: 16px;
        font-weight: 700;
        color: #1c1917;
        line-height: 1.45;
      }
      .reading-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
      }
      .reading-card {
        border-radius: 18px;
        border: 1px solid #e7e5e4;
        background: linear-gradient(180deg, #ffffff, #fafaf9);
        padding: 16px;
      }
      .reading-card .label {
        font-size: 12px;
        color: #57534e;
      }
      .reading-card .value {
        margin-top: 8px;
        font-size: 22px;
        font-weight: 800;
        color: #1c1917;
      }
      .reading-card .level {
        margin-top: 8px;
        display: inline-block;
        padding: 5px 10px;
        border-radius: 999px;
        background: #ecfdf5;
        color: #166534;
        font-size: 12px;
        font-weight: 700;
      }
      .recommendations {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      .recommendations li {
        margin-top: 10px;
        border-radius: 16px;
        padding: 14px 16px;
        background: linear-gradient(180deg, #ffffff, #f0fdf4);
        border: 1px solid #d1fae5;
        line-height: 1.55;
        color: #14532d;
      }
      .footer-note {
        margin-top: 18px;
        font-size: 12px;
        color: #57534e;
        text-align: center;
      }
      @media print {
        body {
          background: #ffffff;
          padding: 0;
        }
        .page {
          max-width: none;
        }
        .hero,
        .section {
          box-shadow: none;
        }
      }
      @media (max-width: 760px) {
        body {
          padding: 16px;
        }
        .hero-top {
          flex-direction: column;
        }
        .summary-grid,
        .reading-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <section class="hero">
        <div class="hero-top">
          <div>
            <p class="eyebrow">${labels.reportGenerated}</p>
            <h1>${getDistrictLabel(record.district, reportLanguage)}${record.location ? ` | ${record.location}` : ''}</h1>
            <p class="hero-subtitle">${record.cropType || labels.generalCheck} | ${new Date(record.createdAt).toLocaleString()}</p>
            <p class="hero-meta">${labels.soilType}: ${record.result.soilType} | ${labels.agroZone}: ${record.result.agroZone}</p>
          </div>
          <div class="score-box">
            <div class="score-label">${labels.soilHealthScore}</div>
            <div class="score-value">${record.result.score}</div>
            <div class="pill">${record.result.classification}</div>
            <div class="hero-meta">${labels.confidence}: ${(record.result.confidence * 100).toFixed(0)}%</div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-title">${labels.detailedPreview}</div>
        <div class="summary-grid">
          <div class="summary-card">
            <div class="label">${labels.soilType}</div>
            <div class="value">${record.result.soilType}</div>
          </div>
          <div class="summary-card">
            <div class="label">${labels.agroZone}</div>
            <div class="value">${record.result.agroZone}</div>
          </div>
          <div class="summary-card">
            <div class="label">${labels.season}</div>
            <div class="value">${record.season ? getSeasonLabel(record.season, reportLanguage) : labels.notSet}</div>
          </div>
          <div class="summary-card">
            <div class="label">${labels.cropType}</div>
            <div class="value">${record.cropType || labels.generalCheck}</div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-title">${labels.soilHealthScore}</div>
        <div class="reading-grid">
          <div class="reading-card">
            <div class="label">${labels.ph}</div>
            <div class="value">${record.result.readings.ph}</div>
            <div class="level">${record.result.levels.ph}</div>
          </div>
          <div class="reading-card">
            <div class="label">${labels.nitrogen}</div>
            <div class="value">${record.result.readings.nitrogen}</div>
            <div class="level">${record.result.levels.nitrogen}</div>
          </div>
          <div class="reading-card">
            <div class="label">${labels.phosphorus}</div>
            <div class="value">${record.result.readings.phosphorus}</div>
            <div class="level">${record.result.levels.phosphorus}</div>
          </div>
          <div class="reading-card">
            <div class="label">${labels.potassium}</div>
            <div class="value">${record.result.readings.potassium}</div>
            <div class="level">${record.result.levels.potassium}</div>
          </div>
          <div class="reading-card">
            <div class="label">${labels.moisture}</div>
            <div class="value">${record.result.readings.moisture}</div>
            <div class="level">${record.result.levels.moisture}</div>
          </div>
          <div class="reading-card">
            <div class="label">${labels.organicMatter}</div>
            <div class="value">${record.result.readings.organicMatter}</div>
            <div class="level">${record.result.levels.organicMatter}</div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-title">${labels.recommendations}</div>
        <ul class="recommendations">
          ${record.result.recommendations.map((item) => `<li>${item}</li>`).join('')}
        </ul>
        <p class="footer-note">${labels.reportGenerated}</p>
      </section>
    </div>
  </body>
</html>`;

    const blob = new Blob([reportHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `soil-health-report-${record._id}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen bg-stone-50">
      <FarmerSidebar user={user} />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <section className="rounded-3xl border border-stone-200 bg-[radial-gradient(circle_at_top_left,_#f7fee7,_#fafaf9_55%)] p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">{t.moduleTag}</p>
                <h1 className="mt-2 text-3xl font-bold text-stone-900">{t.title}</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{t.subtitle}</p>
              </div>
              <div className="flex flex-col items-start gap-3 md:items-end">
                <div className="rounded-full border border-stone-200 bg-white p-1 shadow-sm">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, language: 'English' }))}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        form.language === 'English'
                          ? 'bg-emerald-600 text-white'
                          : 'text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, language: 'Sinhala' }))}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        form.language === 'Sinhala'
                          ? 'bg-emerald-600 text-white'
                          : 'text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      සිංහල
                    </button>
                  </div>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-white/80 px-4 py-3 text-sm text-stone-600">
                  <p className="font-semibold text-stone-800">{t.workflowTitle}</p>
                  <p>{t.workflowText}</p>
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
            <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setMode('quick')}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${mode === 'quick' ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-stone-300 text-stone-700 hover:border-emerald-300 hover:text-emerald-700'}`}
                >
                  {t.quickMode}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('request')}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${mode === 'request' ? 'border-amber-500 bg-amber-500 text-white' : 'border-stone-300 text-stone-700 hover:border-amber-300 hover:text-amber-700'}`}
                >
                  {t.requestMode}
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-stone-700">{t.district}</label>
                    <select
                      value={form.district}
                      onChange={(e) => setForm((current) => ({ ...current, district: e.target.value, location: '' }))}
                      className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-emerald-500"
                    >
                      {DISTRICTS.map((district) => (
                        <option key={district} value={district}>
                          {getDistrictLabel(district, form.language)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-stone-700">{t.season}</label>
                    <select
                      value={form.season}
                      onChange={(e) => setForm((current) => ({ ...current, season: e.target.value }))}
                      className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-emerald-500"
                    >
                      {SEASONS.map((season) => (
                        <option key={season} value={season}>
                          {getSeasonLabel(season, form.language)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-stone-700">{t.fieldLocation}</label>
                    <select
                      value={form.location}
                      onChange={(e) => setForm((current) => ({ ...current, location: e.target.value }))}
                      className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-emerald-500"
                    >
                      <option value="" disabled>{t.fieldLocationPlaceholder}</option>
                      {(FIELD_LOCATIONS_BY_DISTRICT[form.district] ?? []).map((location) => (
                        <option key={location} value={location}>
                          {fieldLocationLabels[form.language][location] ?? location}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-stone-700">{t.cropType}</label>
                    <select
                      value={form.cropType}
                      onChange={(e) => setForm((current) => ({ ...current, cropType: e.target.value }))}
                      className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-emerald-500"
                    >
                      <option value="" disabled>{t.cropTypePlaceholder}</option>
                      {CROP_TYPES.map((cropType) => (
                        <option key={cropType} value={cropType}>
                          {cropTypeLabels[form.language][cropType]}
                        </option>
                      ))}
                    </select>
                  </div>
                  {mode === 'request' && (
                    <div className="md:col-span-2">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <label className="block text-sm font-medium text-stone-700">{t.visitAddress}</label>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            profileAddress ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {profileAddress ? t.profileAddressFound : t.profileAddressMissing}
                        </span>
                      </div>
                      <textarea
                        value={form.visitAddress}
                        onChange={(e) => setForm((current) => ({ ...current, visitAddress: e.target.value }))}
                        rows={3}
                        required={mode === 'request' && !profileAddress}
                        placeholder={profileAddress || t.visitAddressPlaceholder}
                        className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-emerald-500"
                      />
                      <p className="mt-2 text-xs text-stone-500">{t.visitAddressHint}</p>
                    </div>
                  )}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-stone-700">{t.landSize}</label>
                    <input
                      type="number"
                      min="0.25"
                      step="0.25"
                      value={form.landSize}
                      onChange={(e) => setForm((current) => ({ ...current, landSize: e.target.value }))}
                      className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-emerald-500"
                    />
                  </div>
                  {mode === 'request' && (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-stone-700">{t.preferredVisitDate}</label>
                      <input
                        type="date"
                        value={form.preferredDate}
                        onChange={(e) => setForm((current) => ({ ...current, preferredDate: e.target.value }))}
                        className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-emerald-500"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">{t.soilPhoto}</label>
                  <label className="block cursor-pointer">
                    <div
                      className={`rounded-3xl border border-dashed px-5 py-5 transition ${
                        metricsPreview
                          ? 'border-emerald-300 bg-emerald-50/70'
                          : 'border-stone-300 bg-stone-50 hover:border-emerald-300 hover:bg-emerald-50/40'
                      }`}
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start gap-4">
                          {metricsPreview ? (
                            <img
                              src={metricsPreview}
                              alt="Selected soil"
                              className="h-20 w-20 rounded-2xl object-cover border border-emerald-100"
                            />
                          ) : (
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-sm font-semibold text-stone-500 shadow-sm">
                              IMG
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-stone-900">{t.soilPhotoTitle}</p>
                            <p className="mt-1 max-w-xl text-sm leading-6 text-stone-600">{t.soilPhotoDescription}</p>
                            <p className="mt-2 text-xs text-stone-500">{t.soilPhotoHint}</p>
                            <p className="mt-1 text-xs font-medium text-emerald-700">{t.soilTypesCoverage}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-start gap-2 md:items-end">
                          <span className="rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white">
                            {metricsPreview ? t.changePhoto : t.choosePhoto}
                          </span>
                          {metricsPreview && (
                            <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-700">
                              {t.photoReady}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </label>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">
                    {mode === 'request' ? t.requestNote : t.optionalNote}
                  </label>
                  <textarea
                    value={form.farmerNotes}
                    onChange={(e) => setForm((current) => ({ ...current, farmerNotes: e.target.value }))}
                    rows={3}
                    className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-emerald-500"
                    placeholder={t.notePlaceholder}
                  />
                </div>

                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
                )}
                {notice && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className={`rounded-2xl px-5 py-3 text-sm font-semibold text-white transition ${mode === 'quick' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'} disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {submitting ? t.processing : mode === 'quick' ? t.quickSubmit : t.requestSubmit}
                </button>
              </form>
            </section>

            <aside className="space-y-6">
              <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-stone-900">{t.imagePreview}</h2>
                {metricsPreview ? (
                  <img src={metricsPreview} alt="Soil preview" className="mt-4 h-56 w-full rounded-2xl object-cover" />
                ) : (
                  <div className="mt-4 flex h-56 items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-stone-50 text-sm text-stone-400">
                    {t.previewEmpty}
                  </div>
                )}
                {imageMetrics && (
                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-2xl bg-stone-50 p-3">
                      <p className="text-stone-500">{t.brightness}</p>
                      <p className="mt-1 text-lg font-semibold text-stone-900">{imageMetrics.brightness}</p>
                    </div>
                    <div className="rounded-2xl bg-stone-50 p-3">
                      <p className="text-stone-500">{t.texture}</p>
                      <p className="mt-1 text-lg font-semibold text-stone-900">{imageMetrics.textureScore}</p>
                    </div>
                    <div className="rounded-2xl bg-stone-50 p-3">
                      <p className="text-stone-500">{t.rgbMean}</p>
                      <p className="mt-1 text-sm font-semibold text-stone-900">
                        {imageMetrics.redMean} / {imageMetrics.greenMean} / {imageMetrics.blueMean}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-stone-50 p-3">
                      <p className="text-stone-500">{t.currentMode}</p>
                      <p className="mt-1 text-sm font-semibold text-stone-900">
                        {mode === 'quick' ? t.imageOnlyEstimate : t.fusionRequest}
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {latestResult && (
                <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-stone-900">{t.latestResult}</h2>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${getScoreClasses(
                        latestResult.result.classification,
                        latestResult.result.classificationKey
                      )}`}
                    >
                      {latestResult.result.classification}
                    </span>
                  </div>
                  <div className="mt-4 rounded-3xl bg-stone-900 px-5 py-6 text-white">
                    <p className="text-xs uppercase tracking-[0.25em] text-stone-300">{t.soilHealthScore}</p>
                    <p className="mt-2 text-5xl font-bold">{latestResult.result.score}</p>
                    <p className="mt-2 text-sm text-stone-300">
                      {t.confidence} {(latestResult.result.confidence * 100).toFixed(0)}% | {latestResult.result.soilType}
                    </p>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    {Object.entries(latestResult.result.readings).map(([key, value]) => (
                      <div key={key} className="rounded-2xl bg-stone-50 p-3">
                        <p className="text-stone-500">
                          {t[readingLabelKeyMap[key as keyof SoilRecord['result']['readings']]]}
                        </p>
                        <p className="mt-1 font-semibold text-stone-900">{value}</p>
                        <p className="text-xs text-stone-500">{latestResult.result.levels[key]}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-stone-900">{t.recommendations}</p>
                    <ul className="mt-2 space-y-2">
                      {latestResult.result.recommendations.map((recommendation, index) => (
                        <li key={index} className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                          {recommendation}
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              )}
            </aside>
          </div>

          <section className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-stone-900">{t.mySensorRequests}</h2>
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">{filteredRequests.length}</span>
                </div>
                <button
                  type="button"
                  onClick={handleClearRequests}
                  disabled={requests.length === 0 || requestActionLoading === 'all'}
                  className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {requestActionLoading === 'all' ? t.processing : t.clearRequests}
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {(['all', 'pending', 'completed', 'rejected'] as RequestFilter[]).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setRequestFilter(filter)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      requestFilter === filter
                        ? 'border-emerald-500 bg-emerald-600 text-white'
                        : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    {filter === 'all' ? t.requestAll : getLocalizedStatus(filter, form.language)}
                  </button>
                ))}
              </div>
              <div className="mt-4 space-y-3">
                {filteredRequests.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-sm text-stone-500">
                    {t.noRequests}
                  </div>
                )}
                {filteredRequests.map((request) => (
                  <div
                    key={request._id}
                    className={`rounded-2xl border p-4 transition ${
                      selectedRequest?._id === request._id ? 'border-emerald-300 bg-emerald-50/40' : 'border-stone-200 hover:border-emerald-200 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-stone-900">
                          {getDistrictLabel(request.district, form.language)}
                          {request.location ? ` | ${request.location}` : ''}
                        </p>
                        <p className="text-xs text-stone-500">
                          {request.cropType || t.generalFieldCheck} | {request.season ? getSeasonLabel(request.season, form.language) : t.notSet}
                        </p>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(request.status)}`}>
                        {getLocalizedStatus(request.status, form.language)}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-stone-600 md:grid-cols-2">
                      <p>{t.preferredDate}: {request.preferredDate ? new Date(request.preferredDate).toLocaleDateString() : t.notSet}</p>
                      <p>{t.scheduledDate}: {request.scheduledDate ? new Date(request.scheduledDate).toLocaleDateString() : t.pending}</p>
                      <p>{t.previewScore}: {request.imageAssessment?.score ?? '-'} ({request.imageAssessment?.classification ?? t.pending})</p>
                      <p>{t.assignedAdmin}: {request.assignedAdmin?.name || t.notAssignedYet}</p>
                    </div>
                    {request.adminNotes && (
                      <p className="mt-3 rounded-xl bg-stone-50 px-3 py-2 text-xs text-stone-700">
                        {t.adminNote}: {request.adminNotes}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openRequestPreview(request)}
                        className="rounded-full border border-stone-300 px-3 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-100"
                      >
                        {t.requestView}
                      </button>
                      {request.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => {
                            openRequestPreview(request);
                            setRequestEditMode(true);
                          }}
                          className="rounded-full border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                        >
                          {t.requestEdit}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => void handleDeleteRequest(request._id)}
                        disabled={requestActionLoading === request._id}
                        className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {requestActionLoading === request._id ? t.processing : t.deleteRequest}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-stone-900">{t.assessmentHistory}</h2>
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">{history.length}</span>
                </div>
                <button
                  type="button"
                  onClick={handleClearHistory}
                  disabled={history.length === 0 || historyActionLoading === 'all'}
                  className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {historyActionLoading === 'all' ? t.processing : t.clearHistory}
                </button>
              </div>
              <div className="mt-4 space-y-3">
                {history.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-sm text-stone-500">
                    {t.noHistory}
                  </div>
                )}
                {history.map((record) => (
                  <div
                    key={record._id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedRecord(record)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedRecord(record);
                      }
                    }}
                    className={`rounded-2xl border p-4 transition cursor-pointer ${
                      selectedRecord?._id === record._id ? 'border-emerald-300 bg-emerald-50/40' : 'border-stone-200 hover:border-emerald-200 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-stone-900">
                          {getDistrictLabel(record.district, form.language)}
                          {record.location ? ` | ${record.location}` : ''}
                        </p>
                        <p className="text-xs text-stone-500">
                          {record.cropType || t.generalCheck} | {new Date(record.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
                          {record.mode === 'full_fusion' ? t.fullFusion : t.imageOnly}
                        </span>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${getScoreClasses(
                            record.result.classification,
                            record.result.classificationKey
                          )}`}
                        >
                          {record.result.score}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <div className="rounded-xl bg-stone-50 p-3">
                        <p className="text-stone-500">{t.ph}</p>
                        <p className="mt-1 font-semibold text-stone-900">{record.result.readings.ph}</p>
                      </div>
                      <div className="rounded-xl bg-stone-50 p-3">
                        <p className="text-stone-500">NPK</p>
                        <p className="mt-1 font-semibold text-stone-900">
                          {record.result.readings.nitrogen}/{record.result.readings.phosphorus}/{record.result.readings.potassium}
                        </p>
                      </div>
                      <div className="rounded-xl bg-stone-50 p-3">
                        <p className="text-stone-500">{t.soilType}</p>
                        <p className="mt-1 font-semibold text-stone-900">{record.result.soilType}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedRecord(record);
                        }}
                        className="rounded-full border border-stone-300 px-3 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-100"
                      >
                        {t.preview}
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          downloadReport(record);
                        }}
                        className="rounded-full border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                      >
                        {t.downloadReport}
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleDeleteRecord(record._id);
                        }}
                        disabled={historyActionLoading === record._id}
                        className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {historyActionLoading === record._id ? t.processing : t.deleteItem}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
      {popup && (
        <div className="fixed inset-0 z-[70] bg-stone-950/35 backdrop-blur-sm">
          <div className="pointer-events-none flex justify-center px-4 pt-6">
            <div className="popup-slide-down pointer-events-auto w-full max-w-lg rounded-[28px] border border-emerald-100 bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(247,254,250,0.98))] shadow-[0_28px_80px_-34px_rgba(15,23,42,0.5)]">
              <div className="border-b border-emerald-100 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                  {popup.type === 'confirm' ? t.popupConfirm : t.popupOkay}
                </p>
                <h3 className="mt-1 text-xl font-semibold text-stone-900">{popup.title}</h3>
              </div>
              <div className="px-5 py-4">
                <p className="text-sm leading-6 text-stone-600">{popup.message}</p>
                <div className="mt-5 flex flex-wrap justify-end gap-3">
                  {popup.type === 'confirm' && (
                    <button
                      type="button"
                      onClick={() => setPopup(null)}
                      className="rounded-2xl border border-stone-300 px-4 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
                    >
                      {popup.cancelLabel || t.popupCancel}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (popup.type === 'confirm') {
                        void handlePopupConfirm();
                        return;
                      }
                      setPopup(null);
                    }}
                    className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    {popup.confirmLabel || t.popupOkay}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {selectedRequest && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-stone-950/40 px-4 py-6 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => {
            setSelectedRequest(null);
            setRequestEditMode(false);
          }} />
          <div className={`soil-health-modal-scroll relative z-10 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[30px] border border-emerald-100 bg-[linear-gradient(180deg,_#ffffff_0%,_#fbfffc_100%)] shadow-[0_30px_90px_-35px_rgba(21,128,61,0.35)] ${isRequestPreviewScrolling ? 'scrolling' : ''}`}>
            <div className="sticky top-0 flex flex-wrap items-start justify-between gap-3 border-b border-emerald-100 bg-[linear-gradient(135deg,_rgba(236,253,245,0.96),_rgba(255,255,255,0.98))] px-5 py-4 backdrop-blur md:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">{t.requestPreviewTitle}</p>
                <h3 className="mt-1 text-xl font-semibold text-stone-900">
                  {getDistrictLabel(selectedRequest.district, form.language)}
                  {selectedRequest.location ? ` | ${selectedRequest.location}` : ''}
                </h3>
                <p className="mt-1 text-sm text-stone-500">
                  {selectedRequest.cropType || t.generalFieldCheck} | {selectedRequest.season ? getSeasonLabel(selectedRequest.season, form.language) : t.notSet}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(selectedRequest.status)}`}>
                  {getLocalizedStatus(selectedRequest.status, form.language)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRequest(null);
                    setRequestEditMode(false);
                  }}
                  aria-label={t.closePreview}
                  title={t.closePreview}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-red-200 bg-red-500 text-white shadow-sm transition hover:bg-red-600"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M5 5l10 10M15 5L5 15" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-5 md:p-6">
              <div className="grid gap-4 md:grid-cols-[0.96fr,1.04fr]">
                <div className="rounded-3xl bg-[linear-gradient(135deg,_#0f172a,_#1f2937_58%,_#14532d_115%)] px-5 py-6 text-white shadow-lg">
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">{t.requestSummary}</p>
                  <p className="mt-3 text-4xl font-bold">{selectedRequest.imageAssessment?.score ?? '-'}</p>
                  <p className="mt-2 text-sm text-emerald-100/90">
                    {t.previewScore} · {selectedRequest.imageAssessment?.classification ?? t.pending}
                  </p>
                  <p className="mt-4 inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm font-semibold">
                    {selectedRequest.imageAssessment?.soilType || t.notSet}
                  </p>
                  <p className="mt-5 text-sm text-emerald-100/90">{t.requestEditHint}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-stone-200 bg-[linear-gradient(180deg,_#fafaf9,_#ffffff)] p-4 text-sm text-stone-700 shadow-sm">
                    <p className="text-xs text-stone-500">{t.requestStatus}</p>
                    <p className="mt-1 font-semibold text-stone-900">{getLocalizedStatus(selectedRequest.status, form.language)}</p>
                  </div>
                  <div className="rounded-2xl border border-stone-200 bg-[linear-gradient(180deg,_#fafaf9,_#ffffff)] p-4 text-sm text-stone-700 shadow-sm">
                    <p className="text-xs text-stone-500">{t.assignedAdmin}</p>
                    <p className="mt-1 font-semibold text-stone-900">{selectedRequest.assignedAdmin?.name || t.notAssignedYet}</p>
                  </div>
                  <div className="rounded-2xl border border-stone-200 bg-[linear-gradient(180deg,_#fafaf9,_#ffffff)] p-4 text-sm text-stone-700 shadow-sm">
                    <p className="text-xs text-stone-500">{t.requestCreated}</p>
                    <p className="mt-1 font-semibold text-stone-900">{new Date(selectedRequest.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="rounded-2xl border border-stone-200 bg-[linear-gradient(180deg,_#fafaf9,_#ffffff)] p-4 text-sm text-stone-700 shadow-sm">
                    <p className="text-xs text-stone-500">{t.scheduledDate}</p>
                    <p className="mt-1 font-semibold text-stone-900">
                      {selectedRequest.scheduledDate ? new Date(selectedRequest.scheduledDate).toLocaleDateString() : t.pending}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-stone-900">{t.requestDetails}</p>
                  {!requestEditMode ? (
                    <div className="mt-3 grid gap-3 text-sm text-stone-700">
                      <p><span className="text-stone-500">{t.district}:</span> {getDistrictLabel(selectedRequest.district, form.language)}</p>
                      <p><span className="text-stone-500">{t.fieldLocation}:</span> {selectedRequest.location || t.notSet}</p>
                      <p><span className="text-stone-500">{t.visitAddress}:</span> {selectedRequest.visitAddress || t.notSet}</p>
                      <p><span className="text-stone-500">{t.cropType}:</span> {selectedRequest.cropType || t.generalFieldCheck}</p>
                      <p><span className="text-stone-500">{t.season}:</span> {selectedRequest.season ? getSeasonLabel(selectedRequest.season, form.language) : t.notSet}</p>
                      <p><span className="text-stone-500">{t.landSize}:</span> {selectedRequest.landSize ?? t.notSet}</p>
                      <p><span className="text-stone-500">{t.preferredDate}:</span> {selectedRequest.preferredDate ? new Date(selectedRequest.preferredDate).toLocaleDateString() : t.notSet}</p>
                    </div>
                  ) : (
                    <div className="mt-3 grid gap-3">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-stone-700">{t.district}</label>
                        <select
                          value={requestDraft.district}
                          onChange={(event) => setRequestDraft((current) => ({ ...current, district: event.target.value, location: '' }))}
                          className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-emerald-500"
                        >
                          {DISTRICTS.map((district) => (
                            <option key={district} value={district}>
                              {getDistrictLabel(district, form.language)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-stone-700">{t.fieldLocation}</label>
                        <select
                          value={requestDraft.location}
                          onChange={(event) => setRequestDraft((current) => ({ ...current, location: event.target.value }))}
                          className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-emerald-500"
                        >
                          <option value="" disabled>{t.fieldLocationPlaceholder}</option>
                          {(FIELD_LOCATIONS_BY_DISTRICT[requestDraft.district] ?? []).map((location) => (
                            <option key={location} value={location}>
                              {fieldLocationLabels[form.language][location] ?? location}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-stone-700">{t.visitAddress}</label>
                        <textarea
                          value={requestDraft.visitAddress}
                          onChange={(event) => setRequestDraft((current) => ({ ...current, visitAddress: event.target.value }))}
                          rows={3}
                          placeholder={profileAddress || t.visitAddressPlaceholder}
                          className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-stone-700">{t.cropType}</label>
                        <select
                          value={requestDraft.cropType}
                          onChange={(event) => setRequestDraft((current) => ({ ...current, cropType: event.target.value }))}
                          className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-emerald-500"
                        >
                          <option value="" disabled>{t.cropTypePlaceholder}</option>
                          {CROP_TYPES.map((cropType) => (
                            <option key={cropType} value={cropType}>
                              {cropTypeLabels[form.language][cropType]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-stone-700">{t.season}</label>
                          <select
                            value={requestDraft.season}
                            onChange={(event) => setRequestDraft((current) => ({ ...current, season: event.target.value }))}
                            className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-emerald-500"
                          >
                            {SEASONS.map((season) => (
                              <option key={season} value={season}>
                                {getSeasonLabel(season, form.language)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-stone-700">{t.landSize}</label>
                          <input
                            type="number"
                            min="0.25"
                            step="0.25"
                            value={requestDraft.landSize}
                            onChange={(event) => setRequestDraft((current) => ({ ...current, landSize: event.target.value }))}
                            className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-emerald-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-stone-700">{t.preferredVisitDate}</label>
                        <input
                          type="date"
                          value={requestDraft.preferredDate}
                          onChange={(event) => setRequestDraft((current) => ({ ...current, preferredDate: event.target.value }))}
                          className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-stone-900">{t.requestTimeline}</p>
                  {!requestEditMode ? (
                    <div className="mt-3 space-y-3">
                      <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-3 text-sm text-stone-700">
                        <p className="text-xs text-stone-500">{t.requestNoteLabel}</p>
                        <p className="mt-1">{selectedRequest.farmerNotes || t.notSet}</p>
                      </div>
                      <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-3 text-sm text-stone-700">
                        <p className="text-xs text-stone-500">{t.adminNote}</p>
                        <p className="mt-1">{selectedRequest.adminNotes || t.notAssignedYet}</p>
                      </div>
                      <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-3 text-sm text-stone-700">
                        <p className="text-xs text-stone-500">{t.preferredDate}</p>
                        <p className="mt-1">
                          {selectedRequest.preferredDate ? new Date(selectedRequest.preferredDate).toLocaleDateString() : t.notSet}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <label className="mb-1 block text-sm font-medium text-stone-700">{t.requestNoteLabel}</label>
                      <textarea
                        value={requestDraft.farmerNotes}
                        onChange={(event) => setRequestDraft((current) => ({ ...current, farmerNotes: event.target.value }))}
                        rows={8}
                        className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-emerald-500"
                        placeholder={t.notePlaceholder}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {!requestEditMode && selectedRequest.status === 'pending' && (
                  <button
                    type="button"
                    onClick={() => setRequestEditMode(true)}
                    className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
                  >
                    {t.requestEdit}
                  </button>
                )}
                {requestEditMode && (
                  <>
                    <button
                      type="button"
                      onClick={() => void handleUpdateRequest()}
                      disabled={requestActionLoading === selectedRequest._id}
                      className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {requestActionLoading === selectedRequest._id ? t.processing : t.requestSave}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRequestDraft(seedRequestDraft(selectedRequest));
                        setRequestEditMode(false);
                      }}
                      className="rounded-2xl border border-stone-300 px-4 py-3 text-sm font-semibold text-stone-700 hover:bg-stone-100"
                    >
                      {t.requestCancel}
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => void handleDeleteRequest(selectedRequest._id)}
                  disabled={requestActionLoading === selectedRequest._id}
                  className="rounded-2xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {requestActionLoading === selectedRequest._id ? t.processing : t.deleteRequest}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/45 px-4 py-6 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setSelectedRecord(null)} />
          <div className={`soil-health-modal-scroll relative z-10 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[30px] border border-emerald-100 bg-[linear-gradient(180deg,_#ffffff_0%,_#fbfffc_100%)] shadow-[0_30px_90px_-35px_rgba(21,128,61,0.35)] ${isPreviewScrolling ? 'scrolling' : ''}`}>
            <div className="sticky top-0 flex flex-wrap items-start justify-between gap-3 border-b border-emerald-100 bg-[linear-gradient(135deg,_rgba(236,253,245,0.96),_rgba(255,255,255,0.98))] px-5 py-4 backdrop-blur md:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">{t.detailedPreview}</p>
                <h3 className="mt-1 text-xl font-semibold text-stone-900">
                  {getDistrictLabel(selectedRecord.district, form.language)}
                  {selectedRecord.location ? ` | ${selectedRecord.location}` : ''}
                </h3>
                <p className="mt-1 text-sm text-stone-500">
                  {selectedRecord.cropType || t.generalCheck} | {new Date(selectedRecord.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => downloadReport(selectedRecord)}
                  className="rounded-full border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50"
                >
                  {t.downloadReport}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  aria-label={t.closePreview}
                  title={t.closePreview}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-red-200 bg-red-500 text-white shadow-sm transition hover:bg-red-600"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M5 5l10 10M15 5L5 15" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-5 md:p-6">
              <div className="grid gap-4 md:grid-cols-[0.95fr,1.05fr]">
                <div className="rounded-3xl bg-[linear-gradient(135deg,_#0f172a,_#1f2937_58%,_#14532d_115%)] px-5 py-6 text-white shadow-lg">
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">{t.soilHealthScore}</p>
                  <p className="mt-2 text-5xl font-bold">{selectedRecord.result.score}</p>
                  <p className="mt-3 inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm font-semibold">
                    {selectedRecord.result.classification}
                  </p>
                  <p className="mt-4 text-sm text-emerald-100/90">
                    {t.confidence} {(selectedRecord.result.confidence * 100).toFixed(0)}%
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-stone-200 bg-[linear-gradient(180deg,_#fafaf9,_#ffffff)] p-4 text-sm text-stone-700 shadow-sm">
                    <p className="text-xs text-stone-500">{t.soilType}</p>
                    <p className="mt-1 font-semibold text-stone-900">{selectedRecord.result.soilType}</p>
                  </div>
                  <div className="rounded-2xl border border-stone-200 bg-[linear-gradient(180deg,_#fafaf9,_#ffffff)] p-4 text-sm text-stone-700 shadow-sm">
                    <p className="text-xs text-stone-500">{t.agroZone}</p>
                    <p className="mt-1 font-semibold text-stone-900">{selectedRecord.result.agroZone}</p>
                  </div>
                  <div className="rounded-2xl border border-stone-200 bg-[linear-gradient(180deg,_#fafaf9,_#ffffff)] p-4 text-sm text-stone-700 shadow-sm">
                    <p className="text-xs text-stone-500">{t.season}</p>
                    <p className="mt-1 font-semibold text-stone-900">
                      {selectedRecord.season ? getSeasonLabel(selectedRecord.season, form.language) : t.notSet}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-stone-200 bg-[linear-gradient(180deg,_#fafaf9,_#ffffff)] p-4 text-sm text-stone-700 shadow-sm">
                    <p className="text-xs text-stone-500">{t.cropType}</p>
                    <p className="mt-1 font-semibold text-stone-900">{selectedRecord.cropType || t.generalCheck}</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
                {Object.entries(selectedRecord.result.readings).map(([key, value]) => (
                  <div key={key} className="rounded-2xl border border-stone-200 bg-[linear-gradient(180deg,_#ffffff,_#fafaf9)] p-3 text-sm shadow-sm">
                    <p className="text-stone-500">
                      {t[readingLabelKeyMap[key as keyof SoilRecord['result']['readings']]]}
                    </p>
                    <p className="mt-1 font-semibold text-stone-900">{value}</p>
                    <p className="text-xs text-stone-500">{selectedRecord.result.levels[key]}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-3xl border border-emerald-100 bg-[linear-gradient(180deg,_rgba(236,253,245,0.9),_rgba(255,255,255,0.95))] p-4">
                <p className="text-sm font-semibold text-stone-900">{t.recommendations}</p>
                <ul className="mt-3 space-y-2">
                  {selectedRecord.result.recommendations.map((recommendation, index) => (
                    <li key={index} className="rounded-2xl border border-emerald-100 bg-white px-3 py-2 text-sm text-emerald-900 shadow-sm">
                      {recommendation}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
      <style jsx global>{`
        .popup-slide-down {
          animation: soil-health-popup-slide 220ms ease-out;
        }

        @keyframes soil-health-popup-slide {
          0% {
            opacity: 0;
            transform: translateY(-18px) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .soil-health-modal-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(0, 0, 0, 0.18) transparent;
        }

        .soil-health-modal-scroll::-webkit-scrollbar {
          width: 12px;
        }

        .soil-health-modal-scroll::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 999px;
          margin: 12px 6px 12px 0;
        }

        .soil-health-modal-scroll::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.18);
          border-radius: 999px;
          border: 3px solid rgba(255, 255, 255, 0.85);
          transition: background 180ms ease, opacity 180ms ease;
          opacity: 0.35;
        }

        .soil-health-modal-scroll:hover::-webkit-scrollbar-thumb {
          opacity: 0.55;
        }

        .soil-health-modal-scroll.scrolling::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.82);
          opacity: 1;
        }

        .soil-health-modal-scroll.scrolling {
          scrollbar-color: rgba(0, 0, 0, 0.82) transparent;
        }
      `}</style>
    </div>
  );
}
