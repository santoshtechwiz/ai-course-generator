import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"

interface CertificateState {
  isGenerating: boolean
  isSharing: boolean
  downloadCount: number
  lastGenerated?: string
  certificates: Record<string, any>
  shareHistory: any[]
  error?: string
}

const initialState: CertificateState = {
  isGenerating: false,
  isSharing: false,
  downloadCount: 0,
  certificates: {},
  shareHistory: [],
}

// Async thunk for generating certificate
const generateCertificate = createAsyncThunk(
  "certificate/generate",
  async (payload: {
    courseId?: number
    courseName: string
    userName: string
    progress: number
  }) => {
    const { courseId, courseName, userName, progress } = payload

    // Simulate API call for certificate generation
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const certificateData = {
      id: `cert_${courseId}_${Date.now()}`,
      courseId,
      courseName,
      userName,
      progress,
      generatedAt: new Date().toISOString(),
      verificationId: `${userName.replace(/\s+/g, "-").toLowerCase()}_${courseName.replace(/\s+/g, "-").toLowerCase()}_${Date.now()}`,
    }

    // Track analytics
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "certificate_generated", {
        course_id: courseId,
        course_name: courseName,
        user_name: userName,
      })
    }

    return certificateData
  },
)

// Async thunk for sharing certificate
const shareCertificate = createAsyncThunk(
  "certificate/share",
  async (payload: {
    courseId?: number
    courseName: string
    userName: string
  }) => {
    const { courseId, courseName, userName } = payload

    // Simulate API call for generating share link
    await new Promise((resolve) => setTimeout(resolve, 800))

    const shareData = {
      title: `${userName}'s Certificate for ${courseName}`,
      text: `Check out my certificate for completing ${courseName} on CourseAI!`,
      url: `https://courseai.io/certificate/${encodeURIComponent(courseName)}?user=${encodeURIComponent(userName)}`,
      canUseNativeShare: !!navigator.share,
      sharedAt: new Date().toISOString(),
    }

    // Track analytics
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "certificate_shared", {
        course_id: courseId,
        course_name: courseName,
        share_method: navigator.share ? "native" : "clipboard",
      })
    }

    return shareData
  },
)

// Async thunk for tracking certificate downloads
const trackCertificateDownload = createAsyncThunk(
  "certificate/trackDownload",
  async (payload: {
    courseId?: number
    courseName: string
    action: "view" | "download"
  }) => {
    const { courseId, courseName, action } = payload

    // Track analytics
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", `certificate_${action}`, {
        course_id: courseId,
        course_name: courseName,
      })
    }

    return {
      courseId,
      courseName,
      action,
      timestamp: new Date().toISOString(),
    }
  },
)

const certificateSlice = createSlice({
  name: "certificate",
  initialState,
  reducers: {
    resetCertificateState: (state) => {
      state.isGenerating = false
      state.isSharing = false
      state.error = undefined
    },
    incrementDownloadCount: (state) => {
      state.downloadCount += 1
    },
    setCertificateError: (state, action: PayloadAction<string>) => {
      state.error = action.payload
      state.isGenerating = false
      state.isSharing = false
    },
  },
  extraReducers: (builder) => {
    builder
      // Generate certificate
      .addCase(generateCertificate.pending, (state) => {
        state.isGenerating = true
        state.error = undefined
      })
      .addCase(generateCertificate.fulfilled, (state, action) => {
        state.isGenerating = false
        state.downloadCount += 1
        state.lastGenerated = action.payload.generatedAt
        state.certificates[action.payload.id] = action.payload
      })
      .addCase(generateCertificate.rejected, (state, action) => {
        state.isGenerating = false
        state.error = action.error.message || "Failed to generate certificate"
      })

      // Share certificate
      .addCase(shareCertificate.pending, (state) => {
        state.isSharing = true
        state.error = undefined
      })
      .addCase(shareCertificate.fulfilled, (state, action) => {
        state.isSharing = false
        state.shareHistory.push(action.payload)
      })
      .addCase(shareCertificate.rejected, (state, action) => {
        state.isSharing = false
        state.error = action.error.message || "Failed to share certificate"
      })

      // Track download
      .addCase(trackCertificateDownload.fulfilled, (state, action) => {
        if (action.payload.action === "download") {
          state.downloadCount += 1
        }
      })
  },
})

export const {  incrementDownloadCount,  } = certificateSlice.actions

export default certificateSlice.reducer
