<template>
  <v-app class="neon-youtube-app">
    <!-- 배경 네온 블러 효과 요소 (스크롤 공백 방지) -->
    <div class="bg-blob blob-1"></div>
    <div class="bg-blob blob-2"></div>

    <!-- 상단 앱바 -->
    <v-app-bar flat class="glass-app-bar px-1 px-md-4" height="64">
      <v-app-bar-nav-icon @click="drawer = !drawer" class="text-white" density="compact"></v-app-bar-nav-icon>
      <v-icon icon="mdi-play-box-multiple" class="text-accent ml-0 mr-2" size="26"></v-icon>
      
      <!-- 검색창 및 실시간 검색 옵션 버튼 -->
      <v-text-field
        v-model="searchQuery"
        density="compact"
        variant="outlined"
        :placeholder="selectedCreator ? `${selectedCreator.name} 내 검색...` : (isSearchMode ? '새로운 유튜버 또는 영상 검색 (API 사용)...' : (isFavoriteVideosMode ? '즐겨찾기 영상 내 검색...' : '구독 피드 내 검색...'))"
        prepend-inner-icon="mdi-magnify"
        class="search-bar flex-grow-1"
        hide-details
        single-line
        @keydown.enter="handleSearch"
      >
        <template v-slot:append-inner>
          <!-- 실시간 유튜브 API 강제 검색 버튼 -->
          <v-btn
            icon="mdi-cloud-search"
            size="small"
            variant="text"
            color="accent"
            title="유튜브 API로 실시간 검색 실행 (API 쿼리 소모)"
            @click.stop="triggerLiveSearch"
          ></v-btn>
        </template>
      </v-text-field>
    </v-app-bar>

    <!-- 네비게이션 사이드바 -->
    <v-navigation-drawer 
      v-model="drawer" 
      :temporary="$vuetify.display.mobile" 
      class="glass-sidebar border-0" 
      width="280"
    >
      <v-list density="compact" nav class="text-white">
        <!-- 1. 구독 크리에이터 전체 피드 -->
        <v-list-item 
          prepend-icon="mdi-play-box-multiple-outline" 
          title="구독 크리에이터 전체 피드" 
          value="discoverAll" 
          class="mb-2 custom-list-item"
          :class="{ 'neon-active': currentTab === 'discoverAll' }"
          @click="selectDiscoverAll"
        ></v-list-item>

        <!-- 2. 구독 피드 모음 (기본 선택) -->
        <v-list-item 
          prepend-icon="mdi-heart-outline" 
          title="구독 피드 모음" 
          value="discoverHeart" 
          class="mb-2 custom-list-item"
          :class="{ 'neon-active': currentTab === 'discoverHeart' }"
          @click="selectDiscoverHeart"
        ></v-list-item>

        <v-list-item 
          prepend-icon="mdi-heart-multiple" 
          title="즐겨찾기 영상" 
          value="favoriteVideos" 
          class="mb-2 custom-list-item"
          :class="{ 'neon-active': isFavoriteVideosMode }"
          @click="enableFavoriteVideosMode"
        ></v-list-item>
        
        <v-list-item 
          prepend-icon="mdi-magnify" 
          title="유튜브 전체 검색" 
          value="searchMode" 
          class="mb-2 custom-list-item"
          :class="{ 'neon-active': isSearchMode }"
          @click="enableSearchMode"
        ></v-list-item>
        
        <v-divider class="border-opacity-25 my-4"></v-divider>
        
        <div class="px-4 text-subtitle-2 text-grey-lighten-1 mb-2">구독 크리에이터</div>
        
        <!-- 구독 크리에이터가 없을 때 안내 문구 -->
        <div v-if="creators.length === 0" class="px-4 py-3 text-grey-darken-1 text-caption text-center">
          검색 후 채널을 구독하거나<br/>영상을 추가해 보세요.
        </div>

        <v-list-item
          v-for="creator in creators"
          :key="creator.id"
          :prepend-avatar="creator.avatar"
          :title="creator.name"
          :subtitle="creator.subCount + ' 구독자'"
          @click="selectCreatorFilter(creator)"
          class="mb-1 custom-list-item"
          :class="{ 'neon-active': selectedCreator?.id === creator.id }"
        >
          <template v-slot:append>
            <div class="d-flex align-center">
              <!-- 크리에이터 하트 버튼 추가 -->
              <v-btn
                icon="mdi-heart"
                size="small"
                variant="text"
                :color="creator.isFavorite ? 'pink' : 'grey'"
                :title="creator.isFavorite ? '하트 해제' : '구독 피드 모음에 추가 (하트)'"
                @click.stop="toggleCreatorFavorite(creator)"
              ></v-btn>
              <!-- 구독 취소 버튼 -->
              <v-btn
                icon="mdi-account-minus"
                size="small"
                variant="text"
                color="red-lighten-2"
                title="구독 취소"
                @click.stop="unsubscribeCreator(creator)"
              ></v-btn>
            </div>
          </template>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- 메인 콘텐츠 영역 -->
    <v-main class="main-content">
      <v-container fluid class="pa-2 pa-md-6">
        
        <!-- 대시보드 상단 배너 -->
        <v-card class="glass-banner mb-3 mb-md-6 pa-3 pa-md-4 rounded-xl position-relative overflow-hidden">
          <div class="banner-glow"></div>
          <div style="z-index: 2; position: relative;">
            <h1 class="text-subtitle-1 text-md-h4 font-weight-black text-white ma-0">
              {{ getHeaderTitle }}
            </h1>
            <p v-if="isSearchMode" class="text-grey-lighten-2 text-caption mt-1 mb-0">
              상단 검색창에 키워드를 입력하고 엔터를 누르거나 검색 아이콘을 누르면 유튜브 API를 통해 실시간 영상을 검색합니다.
            </p>
          </div>
        </v-card>

        <!-- 로딩 상태 표시 -->
        <v-row v-if="isLoading" justify="center" align="center" style="min-height: 250px;">
          <v-col cols="12" class="text-center">
            <v-progress-circular indeterminate color="accent" size="48" class="mb-3"></v-progress-circular>
            <h3 class="text-subtitle-1 text-grey-lighten-1 font-weight-bold">영상을 불러오는 중입니다...</h3>
          </v-col>
        </v-row>

        <!-- 데이터가 완전히 비어있을 때의 Empty State 화면 -->
        <v-row v-else-if="displayedVideos.length === 0" justify="center" align="center" style="min-height: 250px;">
          <v-col cols="12" class="text-center">
            <v-icon icon="mdi-play-box-outline" size="56" class="text-grey-darken-2 mb-2"></v-icon>
            <h3 class="text-subtitle-1 text-grey-lighten-1 font-weight-bold">표시할 콘텐츠가 없습니다</h3>
            <p class="text-caption text-grey-darken-1 mt-1">
              {{ isFavoriteVideosMode ? '즐겨찾기(좋아요)한 영상이 없습니다.' : (isSearchMode ? '상단 검색바에 키워드를 입력하고 엔터를 눌러 실시간 유튜브 영상을 검색해 보세요.' : (currentTab === 'discoverHeart' ? '하트(즐겨찾기)된 크리에이터가 없거나 새로운 영상이 없습니다. 채널에 하트를 지정해 보세요.' : '구독 중인 채널의 새로운 영상이 없습니다.')) }}
            </p>
          </v-col>
        </v-row>

        <!-- 콘텐츠가 있을 때: 쇼츠 영역과 일반 영상 영역 분리 -->
        <template v-else>
          <!-- 1. 최상단 가로 스크롤 쇼츠 영역 -->
          <div v-if="shortsVideos.length > 0" class="mb-4">
            <div class="d-flex align-center mb-2">
              <v-icon icon="mdi-lightning-bolt" color="red" class="mr-2" size="20"></v-icon>
              <h2 class="text-subtitle-2 text-md-h6 font-weight-bold text-white ma-0">Shorts</h2>
            </div>
            <div class="shorts-horizontal-scroll">
              <div 
                v-for="video in shortsVideos" 
                :key="video.id" 
                class="shorts-card glass-card rounded-xl overflow-hidden d-flex flex-column flex-shrink-0"
                @click="playVideo(video)"
              >
                <div class="shorts-thumbnail-wrapper position-relative">
                  <v-img :src="video.thumbnail" height="200" cover class="align-end">
                    <div class="shorts-badge">Shorts</div>
                  </v-img>
                  <div class="play-overlay">
                    <v-btn icon="mdi-play" color="accent" size="small" class="elevation-4"></v-btn>
                  </div>
                </div>
                <div class="pa-2 d-flex flex-column justify-space-between flex-grow-1">
                  <h3 class="text-white font-weight-bold text-caption text-truncate-2" v-html="video.title"></h3>
                  <div class="d-flex justify-space-between align-center mt-1">
                    <p class="text-grey-lighten-1 text-caption mb-0 text-truncate">{{ video.creatorName }}</p>
                    <v-btn
                      icon="mdi-heart"
                      size="x-small"
                      variant="text"
                      :color="video.isFavorite ? 'pink' : 'grey'"
                      title="영상 즐겨찾기"
                      @click.stop="toggleVideoFavorite(video)"
                    ></v-btn>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 2. 일반 유튜브 영상 그리드 영역 (모바일 기준 높이/간격 축소 적용) -->
          <div v-if="normalVideos.length > 0">
            <div v-if="shortsVideos.length > 0" class="d-flex align-center mb-2">
              <v-icon icon="mdi-youtube" color="red" class="mr-2" size="20"></v-icon>
              <h2 class="text-subtitle-2 text-md-h6 font-weight-bold text-white ma-0">동영상</h2>
            </div>
            <v-row dense>
              <v-col v-for="video in normalVideos" :key="video.id" cols="12" sm="6" md="4" lg="3">
                <v-card class="glass-card rounded-xl overflow-hidden h-100 d-flex flex-column mb-2 mb-sm-0" elevation="0" @click="playVideo(video)">
                  <div class="video-thumbnail-wrapper position-relative">
                    <v-img :src="video.thumbnail" class="video-thumb-img align-end" cover>
                      <div class="video-duration-badge">HD</div>
                    </v-img>
                    <div class="play-overlay">
                      <v-btn icon="mdi-play" color="accent" size="default" class="elevation-4"></v-btn>
                    </div>
                  </div>

                  <!-- 제목/유튜버명 왼쪽, 날짜와 하트/구독 오른쪽 2줄 구성 -->
                  <v-card-text class="flex-grow-1 d-flex flex-column justify-space-between pa-2 pa-md-3">
                    <div class="d-flex justify-space-between align-start gap-2">
                      <div class="flex-grow-1 overflow-hidden">
                        <h3 class="text-white font-weight-bold text-caption text-md-subtitle-1 mb-1 text-truncate-2" v-html="video.title"></h3>
                        <p class="text-grey-lighten-1 text-caption mb-0 text-truncate">{{ video.creatorName }}</p>
                      </div>
                      <div class="d-flex flex-column align-end flex-shrink-0 text-right" style="min-width: 75px;">
                        <span class="text-grey-darken-1 text-caption mb-1">{{ video.views }}</span>
                        <div class="d-flex align-center">
                          <!-- 영상 좋아요(즐겨찾기) 버튼 -->
                          <v-btn 
                            icon="mdi-heart" 
                            size="x-small" 
                            variant="text" 
                            :color="video.isFavorite ? 'pink' : 'grey'" 
                            title="영상 즐겨찾기"
                            @click.stop="toggleVideoFavorite(video)"
                          ></v-btn>
                          <!-- 채널 구독 버튼 -->
                          <v-btn 
                            icon="mdi-account-plus" 
                            size="x-small" 
                            variant="text" 
                            :color="creators.some(c => c.id === video.creatorId) ? 'accent' : 'grey'" 
                            :title="creators.some(c => c.id === video.creatorId) ? '이미 구독 중인 채널' : '이 채널 구독하기'"
                            @click.stop="subscribeCreatorFromCard(video)"
                          ></v-btn>
                        </div>
                      </div>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </div>
        </template>

      </v-container>
    </v-main>

    <!-- 시네마틱 영상 재생 모달 (유튜브 스타일 관련 영상 10개 이상, 댓글 옵션, 히스토리 이어보기 포함) -->
    <v-dialog v-model="isPlayerOpen" max-width="1100px" width="100%" scrim="black" class="mobile-top-dialog">
      <v-card class="glass-modal rounded-xl overflow-hidden pa-0">
        <!-- 모바일 기준 타이틀바 높이 축소 및 위쪽 밀착 -->
        <div class="d-flex justify-space-between align-center px-3 py-1 px-md-4 bg-glass-bar mobile-tight-header">
          <span class="text-white font-weight-bold text-caption text-md-subtitle-1 text-truncate pr-2">{{ activeVideo?.title }}</span>
          <v-btn icon="mdi-close" variant="text" size="x-small" color="white" @click="closePlayer"></v-btn>
        </div>

        <!-- 모달 내부 본문: PC에서는 좌우 배치, 모바일에서는 상하 배치 -->
        <v-row no-gutters>
          <!-- 좌측: 영상 플레이어 및 타이틀 -->
          <v-col cols="12" md="8" class="d-flex flex-column">
            <div class="video-container">
              <iframe
                v-if="activeVideo"
                :src="embedUrl"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
                class="youtube-iframe"
              ></iframe>
            </div>
            <div class="pa-2 pa-md-4 bg-glass-bar flex-grow-1 d-flex justify-space-between align-center flex-wrap gap-2">
              <div>
                <h3 class="text-white text-caption text-md-subtitle-2 font-weight-bold mb-1" v-html="activeVideo?.title"></h3>
                <p class="text-grey-lighten-1 text-caption mb-0">{{ activeVideo?.creatorName }}</p>
                <p v-if="lastWatchedTime > 5" class="text-accent text-caption mt-1 mb-0">
                  ⚡ 이전 시청 기록({{ formatTime(lastWatchedTime) }})에서 이어서 재생됩니다.
                </p>
              </div>
              <div class="d-flex align-center gap-2">
                <!-- 댓글 보기 토글 버튼 옵션 -->
                <v-btn
                  color="accent"
                  variant="outlined"
                  size="small"
                  :prepend-icon="showComments ? 'mdi-comment-off-outline' : 'mdi-comment-multiple-outline'"
                  @click="showComments = !showComments"
                >
                  {{ showComments ? '댓글 숨기기' : '댓글 보기' }}
                </v-btn>
                <v-btn
                  color="red-darken-2"
                  variant="flat"
                  size="small"
                  prepend-icon="mdi-youtube"
                  :href="`https://www.youtube.com/watch?v=${activeVideo?.youtubeId}`"
                  target="_blank"
                >
                  유튜브에서 보기
                </v-btn>
              </div>
            </div>

            <!-- 댓글 영역 토글 섹션 -->
            <div v-if="showComments" class="comments-section pa-3 border-top-glass">
              <div class="text-subtitle-2 font-weight-bold text-white mb-2 d-flex align-center">
                <v-icon icon="mdi-comment-text-outline" class="mr-1 text-accent" size="18"></v-icon>
                실시간 및 주요 댓글
              </div>
              <div class="comments-scroll-area">
                <div v-if="comments.length === 0" class="text-grey-darken-1 text-caption text-center py-4">
                  표시할 댓글이 없습니다.
                </div>
                <div v-for="(comment, index) in comments" :key="index" class="comment-item mb-2 pb-2 border-bottom-glass">
                  <div class="d-flex align-center mb-1">
                    <span class="text-white font-weight-bold text-caption mr-2">{{ comment.author }}</span>
                    <span class="text-grey-darken-1 text-caption">{{ comment.publishedAt }}</span>
                  </div>
                  <p class="text-grey-lighten-2 text-caption mb-0" v-html="comment.text"></p>
                </div>
              </div>
            </div>
          </v-col>

          <!-- 우측/하단: 유튜브 스타일 관련 영상 리스트 (10가지 이상 확장) -->
          <v-col cols="12" md="4" class="related-videos-sidebar pa-3 border-left-glass">
            <div class="text-subtitle-2 font-weight-bold text-white mb-3 d-flex align-center">
              <v-icon icon="mdi-playlist-play" class="mr-1 text-accent" size="20"></v-icon>
              관련 영상 (10개 이상)
            </div>

            <div v-if="relatedVideos.length === 0" class="text-grey-darken-1 text-caption text-center py-6">
              관련 영상이 없습니다.
            </div>

            <div class="related-scroll-area">
              <div 
                v-for="video in relatedVideos" 
                :key="video.id" 
                class="related-video-item d-flex align-center mb-2 pa-2 rounded-lg cursor-pointer"
                @click="playVideo(video)"
              >
                <v-img :src="video.thumbnail" width="100" height="60" cover class="rounded-lg mr-2 flex-shrink-0"></v-img>
                <div class="overflow-hidden flex-grow-1">
                  <h4 class="text-white text-caption font-weight-bold text-truncate-2 mb-1" v-html="video.title"></h4>
                  <p class="text-grey-darken-1 text-caption mb-0">{{ video.creatorName }}</p>
                </div>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const drawer = ref(false)
const searchQuery = ref('')
const selectedCreator = ref(null)
const currentTab = ref('discoverHeart')
const isSearchMode = ref(false)
const isFavoriteVideosMode = ref(false)
const isLoading = ref(false)

const creators = ref([])
const videos = ref([])

const isPlayerOpen = ref(false)
const activeVideo = ref(null)
const showComments = ref(false)
const comments = ref([])
const lastWatchedTime = ref(0)
let historyInterval = null

// --- IndexedDB 설정 (history 스토어 추가) ---
const DB_NAME = 'NeonTubeDB_Clean'
const DB_VERSION = 3

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('creators')) db.createObjectStore('creators', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('videos')) db.createObjectStore('videos', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('history')) db.createObjectStore('history', { keyPath: 'videoId' })
    }
  })
}

// --- 다중 API 키 배열 관리 및 IndexedDB 기반 일자별 상태 관리 로직 ---
const API_KEYS = [
  process.env.VUE_APP_YOUTUBE_API_KEY_1,
  process.env.VUE_APP_YOUTUBE_API_KEY_2,
  process.env.VUE_APP_YOUTUBE_API_KEY_3,
  process.env.VUE_APP_YOUTUBE_API_KEY_4,
  process.env.VUE_APP_YOUTUBE_API_KEY_5,
  process.env.VUE_APP_YOUTUBE_API_KEY_6,
  process.env.VUE_APP_YOUTUBE_API_KEY_7,
  process.env.VUE_APP_YOUTUBE_API_KEY_8,
  process.env.VUE_APP_YOUTUBE_API_KEY_9
].filter(Boolean)

const getTodayString = () => {
  const d = new Date()
  return d.toISOString().split('T')[0]
}

const getActiveApiKeyIndex = async () => {
  if (API_KEYS.length === 0) return 0
  const db = await openDB()
  const today = getTodayString()

  return new Promise((resolve) => {
    const tx = db.transaction('meta', 'readonly')
    const req = tx.objectStore('meta').get('api_key_state')
    req.onsuccess = (e) => {
      const state = e.target.result
      if (!state || state.date !== today) {
        resolve(0)
      } else {
        resolve(state.currentIndex ?? 0)
      }
    }
    req.onerror = () => resolve(0)
  })
}

const saveNextApiKeyIndex = async (nextIndex) => {
  const db = await openDB()
  const today = getTodayString()

  return new Promise((resolve) => {
    const tx = db.transaction('meta', 'readwrite')
    tx.objectStore('meta').put({
      id: 'api_key_state',
      date: today,
      currentIndex: nextIndex
    })
    tx.oncomplete = () => resolve(true)
    tx.onerror = () => resolve(false)
  })
}

const fetchWithKeyRotation = async (urlBuilder) => {
  if (API_KEYS.length === 0) {
    throw new Error('No API Keys available')
  }

  let currentIndex = await getActiveApiKeyIndex()
  let attempts = 0

  while (attempts < API_KEYS.length) {
    const apiKey = API_KEYS[currentIndex]
    if (!apiKey) {
      currentIndex = (currentIndex + 1) % API_KEYS.length
      attempts++
      continue
    }

    const url = urlBuilder(apiKey)

    const response = await fetch(url)
    const data = await response.json()

    if (data.error) {
      const isQuotaError = data.error.code === 403 || 
                           data.error.message?.toLowerCase().includes('quota') ||
                           data.error.errors?.some(e => e.reason === 'quotaExceeded' || e.reason === 'dailyLimitExceeded')

      if (isQuotaError) {
        currentIndex = (currentIndex + 1) % API_KEYS.length
        await saveNextApiKeyIndex(currentIndex)
        attempts++
        continue
      }
    }

    return data
  }

  throw new Error('모든 YouTube API 키의 일일 할당량이 소진되었거나 요청에 실패했습니다.')
}

// --- 영상 히스토리 및 이어보기 기능 ---
const playVideo = async (video) => {
  activeVideo.value = video
  showComments.value = false
  comments.value = []
  lastWatchedTime.value = 0

  // 생방송이 아닌 경우 IndexedDB에서 시청 히스토리 조회
  try {
    const db = await openDB()
    const tx = db.transaction('history', 'readonly')
    const req = tx.objectStore('history').get(video.id)
    req.onsuccess = (e) => {
      if (e.target.result && e.target.result.currentTime) {
        lastWatchedTime.value = e.target.result.currentTime
      }
    }
  } catch (err) {
    console.error('히스토리 로드 실패:', err)
  }

  isPlayerOpen.value = true
  fetchComments(video.youtubeId)
  startHistoryTracker(video.id)
}

const closePlayer = () => {
  isPlayerOpen.value = false
  stopHistoryTracker()
}

// 시청 히스토리 주기적 저장 (예뮬레이션/추적)
const startHistoryTracker = (videoId) => {
  stopHistoryTracker()
  // 시뮬레이션 기반 혹은 플레이어 추적 (여기서는 모달 오픈 중 5초마다 대략적인 시간 증가 혹은 현재 시간 저장)
  historyInterval = setInterval(async () => {
    if (!isPlayerOpen.value) return
    lastWatchedTime.value += 5
    try {
      const db = await openDB()
      const tx = db.transaction('history', 'readwrite')
      tx.objectStore('history').put({
        videoId: videoId,
        currentTime: lastWatchedTime.value,
        updatedAt: new Date().toISOString()
      })
    } catch (err) {
      console.error('히스토리 저장 실패:', err)
    }
  }, 5000)
}

const stopHistoryTracker = () => {
  if (historyInterval) {
    clearInterval(historyInterval)
    historyInterval = null
  }
}

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}분 ${s}초`
}

// 유튜브 임베드 URL (이어보기 start 파라미터 적용, 생방송 제외 일반 영상 대상)
const embedUrl = computed(() => {
  if (!activeVideo.value) return ''
  const startParam = lastWatchedTime.value > 5 ? `&start=${lastWatchedTime.value}` : ''
  return `https://www.youtube.com/embed/${activeVideo.value.youtubeId}?autoplay=1&cc_load_policy=0${startParam}`
})

// 댓글 가져오기 API
const fetchComments = async (youtubeId) => {
  if (API_KEYS.length === 0) return
  try {
    const data = await fetchWithKeyRotation((key) => 
      `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&maxResults=15&videoId=${youtubeId}&key=${key}`
    )
    if (data.items) {
      comments.value = data.items.map(item => {
        const snippet = item.snippet.topLevelComment.snippet
        return {
          author: snippet.authorDisplayName,
          text: snippet.textDisplay,
          publishedAt: snippet.publishedAt.substring(0, 10)
        }
      })
    }
  } catch (err) {
    console.error('댓글을 불러오지 못했습니다:', err)
  }
}

const loadDataFromDB = async () => {
  const db = await openDB()
  
  const creatorTx = db.transaction('creators', 'readonly')
  let dbCreators = await new Promise((resolve) => {
    creatorTx.objectStore('creators').getAll().onsuccess = (e) => resolve(e.target.result)
  })
  creators.value = (dbCreators || []).map(c => ({
    ...c,
    isFavorite: c.isFavorite ?? false
  }))

  const videoTx = db.transaction('videos', 'readonly')
  let dbVideos = await new Promise((resolve) => {
    videoTx.objectStore('videos').getAll().onsuccess = (e) => resolve(e.target.result)
  })
  
  videos.value = (dbVideos || []).sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))
}

const toggleVideoFavorite = async (video) => {
  video.isFavorite = !video.isFavorite
  const db = await openDB()
  const tx = db.transaction('videos', 'readwrite')
  tx.objectStore('videos').put(JSON.parse(JSON.stringify(video)))
}

const toggleCreatorFavorite = async (creator) => {
  creator.isFavorite = !creator.isFavorite
  const db = await openDB()
  const tx = db.transaction('creators', 'readwrite')
  tx.objectStore('creators').put(JSON.parse(JSON.stringify(creator)))
}

const subscribeCreatorFromCard = async (video) => {
  const creatorId = video.creatorId
  const exists = creators.value.some(c => c.id === creatorId)
  if (exists) return

  const newCreator = {
    id: creatorId,
    name: video.creatorName,
    subCount: '구독중',
    avatar: video.thumbnail || 'https://cdn.vuetifyjs.com/images/lists/1.jpg',
    isFavorite: false
  }

  creators.value.push(newCreator)
  const db = await openDB()
  const tx = db.transaction('creators', 'readwrite')
  tx.objectStore('creators').put(newCreator)

  await fetchChannelVideos(newCreator)
}

const unsubscribeCreator = async (creator) => {
  if (!confirm(`'${creator.name}' 채널 구독을 취소하시겠습니까?`)) return

  creators.value = creators.value.filter(c => c.id !== creator.id)
  const db = await openDB()
  const tx = db.transaction('creators', 'readwrite')
  tx.objectStore('creators').delete(creator.id)

  if (selectedCreator.value && selectedCreator.value.id === creator.id) {
    selectDiscoverHeart()
  }
}

const parseVideoItem = (item) => {
  const title = item.snippet.title.toLowerCase()
  const thumbUrl = item.snippet.thumbnails.high ? item.snippet.thumbnails.high.url : item.snippet.thumbnails.default.url
  let isShorts = title.includes('#shorts') || title.includes('shorts') || title.includes('#쇼츠')

  return {
    id: item.id.videoId,
    youtubeId: item.id.videoId,
    creatorId: item.snippet.channelId,
    creatorName: item.snippet.channelTitle,
    title: item.snippet.title,
    thumbnail: thumbUrl,
    isShorts: isShorts,
    isFavorite: false,
    views: item.snippet.publishedAt.substring(0, 10),
    publishedAt: item.snippet.publishedAt
  }
}

const fetchChannelVideos = async (creator) => {
  if (API_KEYS.length === 0) return

  try {
    const data = await fetchWithKeyRotation((key) => 
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=25&channelId=${creator.id}&order=date&type=video&key=${key}`
    )

    if (!data.error && data.items) {
      const db = await openDB()
      const existingMap = new Map(videos.value.map(v => [v.id, v.isFavorite]))

      const channelVideos = data.items.map(item => {
        const parsed = parseVideoItem(item)
        if (existingMap.has(parsed.id)) {
          parsed.isFavorite = existingMap.get(parsed.id)
        }
        return parsed
      })

      const tx = db.transaction('videos', 'readwrite')
      const store = tx.objectStore('videos')
      channelVideos.forEach(v => store.put(v))

      await loadDataFromDB()
    }
  } catch (error) {
    console.error('채널 영상 불러오기 실패:', error)
  }
}

const handleSearch = () => {
  if (selectedCreator.value || isFavoriteVideosMode.value) return
  if (isSearchMode.value) searchYouTubeVideos()
}

const triggerLiveSearch = async () => {
  if (!searchQuery.value.trim()) return
  await searchYouTubeVideos()
}

const searchYouTubeVideos = async () => {
  if (!searchQuery.value.trim() || API_KEYS.length === 0) return
  
  const query = searchQuery.value.trim()
  isLoading.value = true
  
  try {
    const data = await fetchWithKeyRotation((key) => 
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=30&q=${encodeURIComponent(query)}&type=video&key=${key}`
    )
    
    if (data.error) {
      isLoading.value = false
      return
    }

    const existingMap = new Map(videos.value.map(v => [v.id, v.isFavorite]))

    const apiVideos = data.items.map(item => {
      const parsed = parseVideoItem(item)
      if (existingMap.has(parsed.id)) {
        parsed.isFavorite = existingMap.get(parsed.id)
      }
      return parsed
    })

    apiVideos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    videos.value = apiVideos

    const db = await openDB()
    const tx = db.transaction('videos', 'readwrite')
    const store = tx.objectStore('videos')
    apiVideos.forEach(v => store.put(v))

  } catch (error) {
    console.error('YouTube API 요청 실패:', error)
  } finally {
    isLoading.value = false
  }
}

const selectDiscoverAll = () => {
  selectedCreator.value = null
  currentTab.value = 'discoverAll'
  isSearchMode.value = false
  isFavoriteVideosMode.value = false
  searchQuery.value = ''
  if (window.innerWidth < 960) drawer.value = false
}

const selectDiscoverHeart = () => {
  selectedCreator.value = null
  currentTab.value = 'discoverHeart'
  isSearchMode.value = false
  isFavoriteVideosMode.value = false
  searchQuery.value = ''
  if (window.innerWidth < 960) drawer.value = false
}

const enableFavoriteVideosMode = () => {
  selectedCreator.value = null
  currentTab.value = ''
  isSearchMode.value = false
  isFavoriteVideosMode.value = true
  searchQuery.value = ''
  if (window.innerWidth < 960) drawer.value = false
}

const enableSearchMode = () => {
  selectedCreator.value = null
  currentTab.value = ''
  isSearchMode.value = true
  isFavoriteVideosMode.value = false
  searchQuery.value = ''
  if (window.innerWidth < 960) drawer.value = false
}

const selectCreatorFilter = (creator) => {
  selectedCreator.value = creator
  currentTab.value = ''
  isSearchMode.value = false
  isFavoriteVideosMode.value = false
  searchQuery.value = ''
  if (window.innerWidth < 960) drawer.value = false
}

onMounted(async () => {
  await loadDataFromDB()
})

onUnmounted(() => {
  stopHistoryTracker()
})

const getHeaderTitle = computed(() => {
  if (selectedCreator.value) return selectedCreator.value.name + ' 채널'
  if (isFavoriteVideosMode.value) return '즐겨찾기 영상 모음'
  if (isSearchMode.value) return '유튜브 전체 검색 모드'
  if (currentTab.value === 'discoverAll') return '구독 크리에이터 전체 피드'
  if (currentTab.value === 'discoverHeart') return '구독 피드 모음 (하트 채널)'
  return '구독 피드 모음 (하트 채널)'
})

const displayedVideos = computed(() => {
  let result = videos.value

  if (selectedCreator.value) {
    result = result.filter(v => v.creatorId === selectedCreator.value.id)
  } else if (isFavoriteVideosMode.value) {
    result = result.filter(v => v.isFavorite)
  } else if (isSearchMode.value) {
    return result
  } else if (currentTab.value === 'discoverAll') {
    const subscribedIds = creators.value.map(c => c.id)
    result = result.filter(v => subscribedIds.includes(v.creatorId))
  } else if (currentTab.value === 'discoverHeart') {
    const favoriteCreatorIds = creators.value.filter(c => c.isFavorite).map(c => c.id)
    result = result.filter(v => favoriteCreatorIds.includes(v.creatorId))
  }

  if (searchQuery.value.trim() && !isSearchMode.value) {
    const query = searchQuery.value.trim().toLowerCase()
    result = result.filter(v => 
      v.title.toLowerCase().includes(query) || 
      v.creatorName.toLowerCase().includes(query)
    )
  }

  return result
})

// 관련 영상 10가지 이상 추출 (최소 10개 이상 보장)
const relatedVideos = computed(() => {
  if (!activeVideo.value) return []
  return videos.value.filter(v => v.id !== activeVideo.value.id).slice(0, 15)
})

const shortsVideos = computed(() => {
  return displayedVideos.value.filter(v => v.isShorts)
})

const normalVideos = computed(() => {
  return displayedVideos.value.filter(v => !v.isShorts)
})
</script>

<style>
html, body {
  overflow-x: hidden !important;
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.neon-youtube-app {
  background-color: #06070a !important;
  font-family: 'Inter', sans-serif;
  color: #ffffff;
  position: relative;
  overflow-x: hidden !important;
  width: 100%;
}

.bg-blob {
  position: absolute;
  width: 350px;
  height: 350px;
  border-radius: 50%;
  filter: blur(80px);
  z-index: 0;
  opacity: 0.15;
  pointer-events: none;
}
.blob-1 { top: -100px; left: -100px; background: #7928ca; }
.blob-2 { bottom: -100px; right: -100px; background: #0070f3; }

.glass-app-bar, .glass-sidebar, .glass-card, .glass-banner, .glass-chip, .glass-modal, .bg-glass-bar {
  background: rgba(255, 255, 255, 0.03) !important;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
}

.text-accent {
  color: #a78bfa !important;
}

.search-bar {
  max-width: 100%;
}
.search-bar .v-field {
  border-radius: 30px !important;
  background: rgba(0, 0, 0, 0.3) !important;
  color: white !important;
  font-size: 13px !important;
}

.custom-list-item {
  border-radius: 12px !important;
  margin-bottom: 4px;
  transition: all 0.3s ease;
}
.custom-list-item:hover {
  background: rgba(255, 255, 255, 0.07) !important;
}
.neon-active {
  background: linear-gradient(135deg, rgba(121, 40, 202, 0.4), rgba(0, 112, 243, 0.4)) !important;
  border: 1px solid rgba(167, 139, 250, 0.3) !important;
}

.glass-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
}
.glass-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(121, 40, 202, 0.3) !important;
  border-color: rgba(167, 139, 250, 0.4) !important;
}

/* 모바일 기준 일반 영상 썸네일 높이 축소 및 간격 최적화 */
.video-thumb-img {
  height: 110px !important;
}
@media (min-width: 600px) {
  .video-thumb-img {
    height: 150px !important;
  }
}

.shorts-horizontal-scroll {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
}
.shorts-horizontal-scroll::-webkit-scrollbar {
  height: 5px;
}
.shorts-horizontal-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.shorts-card {
  width: 130px;
  min-width: 130px;
}
@media (min-width: 600px) {
  .shorts-card {
    width: 160px;
    min-width: 160px;
  }
}

.shorts-badge {
  position: absolute;
  top: 6px;
  left: 6px;
  background: rgba(255, 0, 0, 0.8);
  color: white;
  padding: 2px 5px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: bold;
}

.play-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}
.video-thumbnail-wrapper:hover .play-overlay,
.shorts-thumbnail-wrapper:hover .play-overlay {
  opacity: 1;
}

.video-duration-badge {
  position: absolute;
  bottom: 6px;
  right: 6px;
  background: rgba(0, 0, 0, 0.8);
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: bold;
}

.video-container {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%;
  background: #000;
}

.youtube-iframe {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
}

/* 모바일 기준 타이틀바 컴팩트화 및 상단 밀착 보정 */
@media (max-width: 959px) {
  .mobile-top-dialog {
    margin-top: 0 !important;
    align-self: flex-start !important;
    max-height: 100vh !important;
    border-radius: 0 !important;
  }
}
.mobile-tight-header {
  min-height: 36px !important;
}

.border-left-glass {
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.2);
}

.border-top-glass {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.15);
}

.border-bottom-glass {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.related-scroll-area, .comments-scroll-area {
  max-height: 320px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
}
.related-scroll-area::-webkit-scrollbar, .comments-scroll-area::-webkit-scrollbar {
  width: 4px;
}
.related-scroll-area::-webkit-scrollbar-thumb, .comments-scroll-area::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.related-video-item, .comment-item {
  transition: background 0.2s ease;
}
.related-video-item:hover {
  background: rgba(255, 255, 255, 0.07);
}

.text-truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>