<template>
<v-app class="neon-youtube-app prevent-pull-to-refresh">
<!-- 배경 네온 블러 효과 요소 -->
<div class="bg-blob blob-1"></div>
<div class="bg-blob blob-2"></div>
​<!-- 숨겨진 파일 업로드 인풋들 -->
<input ref="creatorFileInput" type="file" accept="application/json,.json" style="display: none;" @change="handleUploadCreators" />
<input ref="playlistFileInput" type="file" accept="application/json,.json" style="display: none;" @change="handleUploadPlaylists" />
<input ref="singlePlaylistFileInput" type="file" accept="application/json,.json" style="display: none;" @change="handleUploadSinglePlaylist" />
<input ref="musicFileInput" type="file" accept="application/json,.json" style="display: none;" @change="handleUploadMusic" />
​<!-- 상단 앱바 -->
<v-app-bar flat class="glass-app-bar px-2 px-md-6" height="68">
<v-app-bar-nav-icon @click="drawer = !drawer" class="text-white" density="compact"></v-app-bar-nav-icon>
​<div class="d-flex align-center ml-1 mr-3 gap-1 flex-shrink-0">
<v-icon icon="mdi-play-box-multiple" class="text-accent" size="28"></v-icon>
<span class="text-accent text-caption font-weight-bold ml-1" title="현재 사용 중인 YouTube API 키 번호">#{{ currentApiKeyNumber }}</span>
</div>
​<v-text-field
v-model="searchQuery"
density="compact"
variant="outlined"
:placeholder="getSearchPlaceholder"
prepend-inner-icon="mdi-magnify"
class="search-bar flex-grow-1 mx-2"
hide-details
single-line
@keydown.enter="handleSearch"
>
<template v-slot:append-inner>
<div class="d-flex align-center gap-1">
<v-btn
v-if="selectedVideoIds.length > 0"
icon="mdi-playlist-play"
size="small"
variant="flat"
color="accent"
:title="'선택한 ' + selectedVideoIds.length + '개 영상 연속 재생'"
@click.stop="playSelectedVideos"
>
<template v-slot:default>
<v-badge
color="error"
:content="selectedVideoIds.length"
offset-x="-2"
offset-y="-2"
>
<v-icon icon="mdi-playlist-play" size="20" color="accent"></v-icon>
</v-badge>
</template>
</v-btn>
​<v-btn
v-if="selectedVideoIds.length > 0"
icon="mdi-folder-plus"
size="small"
variant="flat"
color="deep-purple-accent-2"
title="선택한 영상을 재생 목록에 저장"
@click.stop="openSaveToPlaylistDialog(null)"
></v-btn>
​<v-btn
v-if="selectedVideoIds.length > 0"
icon="mdi-close-circle"
size="small"
variant="text"
color="red-lighten-2"
title="선택한 영상 내역 초기화"
@click.stop="clearSelectedVideos"
></v-btn>
​<v-btn
icon
size="small"
variant="text"
color="accent"
title="최신 영상 동기화 / 검색 실행"
@click.stop="triggerTabSearchOrUpdate"
>
<v-icon icon="mdi-cloud-search"></v-icon>
</v-btn>
</div>
</template>
</v-text-field>
​<template v-slot:extension>
<div class="d-flex align-center px-4 py-1 w-100 overflow-x-auto glass-extension-bar">
<div class="d-flex align-center gap-2 icon-tab-group pa-1.5 rounded-pill flex-nowrap w-100 justify-start justify-md-center">
<v-btn
icon="mdi-play-box-multiple-outline"
size="small"
variant="flat"
:color="currentTab === 'discoverAll' && !selectedCreator ? 'deep-purple-darken-2' : 'transparent'"
class="text-white flex-shrink-0 rounded-circle"
title="구독 전체 피드"
@click="selectDiscoverAll"
></v-btn>
<v-btn
icon="mdi-heart-outline"
size="small"
variant="flat"
:color="currentTab === 'discoverHeart' && !selectedCreator ? 'deep-purple-darken-2' : 'transparent'"
class="text-white flex-shrink-0 rounded-circle"
title="구독 피드 모음 (하트 크리에이터)"
@click="selectDiscoverHeart"
></v-btn>
<v-btn
icon="mdi-brain"
size="small"
variant="flat"
:color="isAlgorithmMode ? 'deep-purple-darken-2' : 'transparent'"
class="text-white flex-shrink-0 rounded-circle"
title="알고리즘 추천탭"
@click="enableAlgorithmMode"
></v-btn>
<v-btn
icon="mdi-heart-multiple"
size="small"
variant="flat"
:color="isFavoriteVideosMode ? 'deep-purple-darken-2' : 'transparent'"
class="text-white flex-shrink-0 rounded-circle"
title="즐겨찾기 영상"
@click="enableFavoriteVideosMode"
></v-btn>
<v-btn
icon="mdi-playlist-music"
size="small"
variant="flat"
:color="isPlaylistMode ? 'deep-purple-darken-2' : 'transparent'"
class="text-white flex-shrink-0 rounded-circle"
title="재생 목록"
@click="enablePlaylistMode"
></v-btn>
<v-btn
icon="mdi-history"
size="small"
variant="flat"
:color="isHistoryMode ? 'deep-purple-darken-2' : 'transparent'"
class="text-white flex-shrink-0 rounded-circle"
title="시청 기록"
@click="enableHistoryMode"
></v-btn>
<v-btn
icon="mdi-magnify"
size="small"
variant="flat"
:color="isSearchMode ? 'deep-purple-darken-2' : 'transparent'"
class="text-white flex-shrink-0 rounded-circle"
title="유튜브 전체 검색"
@click="enableSearchMode"
></v-btn>
<v-btn
icon="mdi-fire"
size="small"
variant="flat"
:color="isTrendingMode ? 'deep-purple-darken-2' : 'transparent'"
class="text-white flex-shrink-0 rounded-circle"
title="실시간 급상승 영상"
@click="enableTrendingMode"
></v-btn>
<v-btn
icon="mdi-music-box-outline"
size="small"
variant="flat"
:color="isMusicMode ? 'deep-purple-darken-2' : 'transparent'"
class="text-white flex-shrink-0 rounded-circle"
title="음악 탭"
@click="enableMusicMode"
></v-btn>
</div>
</div>
<v-progress-linear
v-if="isLoading"
indeterminate
color="accent"
height="3"
></v-progress-linear>
</template>
</v-app-bar>
​<!-- 네비게이션 사이드바 -->
<v-navigation-drawer 
v-model="drawer" 
:temporary="$vuetify.display.mobile" 
class="glass-sidebar border-0" 
width="300"
>
<v-list density="compact" nav class="text-white pa-3">
<v-list-item
prepend-icon="mdi-play-box-multiple-outline"
title="구독 크리에이터 전체 피드"
value="discoverAll"
class="mb-2 custom-list-item"
:class="{ 'neon-active': currentTab === 'discoverAll' && !selectedCreator }"
@click="selectDiscoverAll"
></v-list-item>
​<v-list-item
prepend-icon="mdi-heart-outline"
title="구독 피드 모음 (하트 인플루언서)"
value="discoverHeart"
class="mb-2 custom-list-item"
:class="{ 'neon-active': currentTab === 'discoverHeart' && !selectedCreator }"
@click="selectDiscoverHeart"
></v-list-item>
​<v-list-item
prepend-icon="mdi-brain"
title="알고리즘 추천 피드"
value="algorithmMode"
class="mb-2 custom-list-item"
:class="{ 'neon-active': isAlgorithmMode }"
@click="enableAlgorithmMode"
></v-list-item>
​<v-list-item
prepend-icon="mdi-heart-multiple"
title="즐겨찾기 영상"
value="favoriteVideos"
class="mb-2 custom-list-item"
:class="{ 'neon-active': isFavoriteVideosMode }"
@click="enableFavoriteVideosMode"
></v-list-item>
​<v-list-item
prepend-icon="mdi-playlist-music"
title="재생 목록"
value="playlistMode"
class="mb-2 custom-list-item"
:class="{ 'neon-active': isPlaylistMode }"
@click="enablePlaylistMode"
></v-list-item>
​<v-list-item
prepend-icon="mdi-history"
title="시청 기록"
value="historyMode"
class="mb-2 custom-list-item"
:class="{ 'neon-active': isHistoryMode }"
@click="enableHistoryMode"
></v-list-item>
​<v-list-item
prepend-icon="mdi-magnify"
title="유튜브 전체 검색"
value="searchMode"
class="mb-2 custom-list-item"
:class="{ 'neon-active': isSearchMode }"
@click="enableSearchMode"
></v-list-item>
​<v-list-item
prepend-icon="mdi-fire"
title="실시간 급상승 영상"
value="trendingMode"
class="mb-2 custom-list-item"
:class="{ 'neon-active': isTrendingMode }"
@click="enableTrendingMode"
></v-list-item>
​<v-list-item
prepend-icon="mdi-music-box-outline"
title="음악 탭"
value="musicMode"
class="mb-2 custom-list-item"
:class="{ 'neon-active': isMusicMode }"
@click="enableMusicMode"
></v-list-item>
​<v-divider class="border-opacity-25 my-4"></v-divider>
​<div class="px-3 d-flex align-center justify-space-between mb-2">
<span class="text-subtitle-2 text-grey-lighten-1 font-weight-bold">구독 크리에이터</span>
<div class="d-flex align-center gap-1">
<v-btn icon="mdi-download" size="x-small" variant="text" color="accent" title="구독 목록 백업 (내려받기)" @click="downloadCreatorsBackup"></v-btn>
<v-btn icon="mdi-upload" size="x-small" variant="text" color="accent" title="구독 목록 불러오기 (올리기)" @click="triggerUploadCreators"></v-btn>
</div>
</div>
​<div v-if="creators.length === 0" class="px-3 py-4 text-grey-darken-1 text-caption text-center">
검색 후 채널을 구독하거나
영상을 추가해 보세요.
</div>
​<v-list-item
v-for="creator in creators"
:key="creator.id"
:prepend-avatar="creator.avatar"
:title="creator.name"
:subtitle="formatCreatorSubCount(creator.subCount)"
@click="selectCreatorFilter(creator)"
class="mb-1 custom-list-item"
:class="{ 'neon-active': selectedCreator?.id === creator.id }"
>
<template v-slot:append>
<div class="d-flex align-center">
<v-btn
icon="mdi-heart"
size="small"
variant="text"
:color="creator.isFavorite ? 'pink' : 'grey'"
:title="creator.isFavorite ? '하트 해제' : '구독 피드 모음에 추가 (하트)'"
@click.stop="toggleCreatorFavorite(creator)"
></v-btn>
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
​<!-- 메인 콘텐츠 영역 -->
<v-main
ref="mainScrollRef"
class="main-content position-relative prevent-pull-to-refresh"
:class="{ 'player-dock-active': isPlayerOpen && isPlayerCompactMode && !isFloatingPlayerMode }"
@scroll="checkMainScroll"
>
<v-container fluid class="pa-3 pa-md-8 max-container-width">
<v-card class="glass-banner mb-4 mb-md-6 p-4 p-md-6 rounded-2xl position-relative overflow-hidden">
<div class="banner-glow"></div>
<div style="z-index: 2; position: relative;" class="d-flex align-center justify-space-between gap-3 flex-wrap">
<div class="d-flex align-center gap-3">
<v-checkbox
v-if="(!isPlaylistMode || activePlaylistId) && !isHistoryMode"
v-model="isAllSelected"
:indeterminate="isIndeterminate"
color="accent"
hide-details
density="compact"
class="ma-0 pa-0"
title="현재 표시된 모든 영상 선택/해제"
@change="toggleSelectAll"
></v-checkbox>
<h1 class="text-subtitle-1 text-md-h4 font-weight-black text-white ma-0">
{{ getHeaderTitle }} <span v-if="selectedVideoIds.length > 0" class="text-accent text-subtitle-2">({{ selectedVideoIds.length }}개 선택됨)</span>
</h1>
</div>
<v-btn
v-if="isAlgorithmMode"
size="small"
variant="flat"
color="deep-purple-darken-2"
prepend-icon="mdi-refresh"
class="text-white font-weight-bold rounded-pill px-4"
@click="fetchAlgorithmVideos"
>
추천 새로고침
</v-btn>
</div>
</v-card>
</v-container>
</v-main>
</v-app>
</template>
​<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
​const drawer = ref(false)
const searchQuery = ref('')
const currentApiKeyNumber = ref(1)
​const isAlgorithmMode = ref(false)
const isMusicMode = ref(false)
const isTrendingMode = ref(false)
const isSearchMode = ref(false)
const isHistoryMode = ref(false)
const isFavoriteVideosMode = ref(false)
const isPlaylistMode = ref(false)
const selectedCreator = ref(null)
const currentTab = ref('discoverHeart')
const isLoading = ref(false)
const activePlaylistId = ref(null)
const isPlayerOpen = ref(false)
const isPlayerCompactMode = ref(false)
const isFloatingPlayerMode = ref(false)
​const creators = ref([])
const selectedVideoIds = ref([])
const mainScrollRef = ref(null)
​const isAllSelected = ref(false)
const isIndeterminate = ref(false)
​const getSearchPlaceholder = computed(() => {
if (selectedCreator.value) {
return selectedCreator.value.name + ' 내 검색어 입력 후 엔터...'
}
if (isAlgorithmMode.value) return '알고리즘 추천 영상 내 검색어 입력 후 엔터...'
if (isMusicMode.value) return '음악/아티스트 검색어 입력 후 엔터...'
if (isTrendingMode.value) return '인기 급상승 영상 내 검색어 입력 후 엔터...'
if (isSearchMode.value) return '유튜브 전체 검색어 입력 후 엔터...'
if (isHistoryMode.value) return '시청 기록 내 검색어 입력 후 엔터...'
if (isFavoriteVideosMode.value) return '즐겨찾기 영상 내 검색어 입력 후 엔터...'
if (isPlaylistMode.value) return '재생 목록 내 검색어 입력 후 엔터...'
return '구독 피드 내 검색어 입력 후 엔터 또는 돋보기 버튼 클릭...'
})
​const getHeaderTitle = computed(() => {
if (selectedCreator.value) return selectedCreator.value.name + ' 피드'
if (isAlgorithmMode.value) return '알고리즘 추천'
if (isMusicMode.value) return '음악'
if (isTrendingMode.value) return '실시간 급상승'
if (isSearchMode.value) return '검색 결과'
if (isHistoryMode.value) return '시청 기록'
if (isFavoriteVideosMode.value) return '즐겨찾기 영상'
if (isPlaylistMode.value) return '재생 목록'
return currentTab.value === 'discoverAll' ? '구독 전체 피드' : '구독 피드 모음'
})
​// Kiwi 브라우저 제스처 차단을 위한 overscroll-behavior 훅 핸들러
onMounted(() => {
document.documentElement.style.overscrollBehaviorY = 'contain'
document.body.style.overscrollBehaviorY = 'contain'
})
​onUnmounted(() => {
document.documentElement.style.overscrollBehaviorY = ''
document.body.style.overscrollBehaviorY = ''
})
​function handleSearch() {}
function triggerTabSearchOrUpdate() {}
function selectDiscoverAll() { currentTab.value = 'discoverAll'; selectedCreator.value = null; disableModes(); }
function selectDiscoverHeart() { currentTab.value = 'discoverHeart'; selectedCreator.value = null; disableModes(); }
function enableAlgorithmMode() { resetModes(); isAlgorithmMode.value = true; }
function enableFavoriteVideosMode() { resetModes(); isFavoriteVideosMode.value = true; }
function enablePlaylistMode() { resetModes(); isPlaylistMode.value = true; }
function enableHistoryMode() { resetModes(); isHistoryMode.value = true; }
function enableSearchMode() { resetModes(); isSearchMode.value = true; }
function enableTrendingMode() { resetModes(); isTrendingMode.value = true; }
function enableMusicMode() { resetModes(); isMusicMode.value = true; }
function disableModes() {
isAlgorithmMode.value = false
isMusicMode.value = false
isTrendingMode.value = false
isSearchMode.value = false
isHistoryMode.value = false
isFavoriteVideosMode.value = false
isPlaylistMode.value = false
}
function resetModes() {
selectedCreator.value = null
disableModes()
}
function playSelectedVideos() {}
function openSaveToPlaylistDialog() {}
function clearSelectedVideos() { selectedVideoIds.value = [] }
function downloadCreatorsBackup() {}
function triggerUploadCreators() {}
function handleUploadCreators() {}
function handleUploadPlaylists() {}
function handleUploadSinglePlaylist() {}
function handleUploadMusic() {}
function formatCreatorSubCount(count) { return count ? count.toLocaleString() : '0' }
function selectCreatorFilter(creator) { resetModes(); selectedCreator.value = creator }
function toggleCreatorFavorite(creator) { creator.isFavorite = !creator.isFavorite }
function unsubscribeCreator(creator) { creators.value = creators.value.filter(c => c.id !== creator.id) }
function toggleSelectAll() {}
function fetchAlgorithmVideos() {}
function checkMainScroll() {}
</script>
​<style scoped>
/* Kiwi 브라우저 Pull-to-Refresh 및 상하 제스처 충돌 방지 핵심 스타일 */
html,
body,
.neon-youtube-app,
.prevent-pull-to-refresh {
overscroll-behavior-y: contain !important;
touch-action: pan-x pan-y;
}
​.main-content.prevent-pull-to-refresh {
overscroll-behavior-y: contain !important;
-webkit-overflow-scrolling: touch;
}
</style>