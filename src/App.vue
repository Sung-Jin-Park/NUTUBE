<template>
<v-app class="neon-youtube-app">
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
:placeholder="selectedCreator ? ${selectedCreator.name} 내 검색어 입력 후 엔터... : (isAlgorithmMode ? '알고리즘 추천 영상 내 검색어 입력 후 엔터...' : (isMusicMode ? '음악/아티스트 검색어 입력 후 엔터...' : (isTrendingMode ? '인기 급상승 영상 내 검색어 입력 후 엔터...' : (isSearchMode ? '유튜브 전체 검색어 입력 후 엔터...' : (isHistoryMode ? '시청 기록 내 검색어 입력 후 엔터...' : (isFavoriteVideosMode ? '즐겨찾기 영상 내 검색어 입력 후 엔터...' : (isPlaylistMode ? '재생 목록 내 검색어 입력 후 엔터...' : '구독 피드 내 검색어 입력 후 엔터 또는 돋보기 버튼 클릭...')))))))"
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
:title="선택한 ${selectedVideoIds.length}개 영상 연속 재생"
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
​<!-- 메인 콘텐츠 영역 (Kiwi 등 모바일 브라우저의 Pull-to-Refresh 방지 추가) -->
<v-main
ref="mainScrollRef"
class="main-content position-relative prevent-pull-to-refresh"
:class="{ 'player-dock-active': isPlayerOpen && isPlayerCompactMode && !isFloatingPlayerMode }"
@scroll="checkMainScroll"
@touchstart="onMainTouchStart"
@touchend="onMainTouchEnd"
>
<v-container fluid class="pa-3 pa-md-8 max-container-width">
​<!-- 타이틀 영역 -->
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
<!-- 알고리즘 새로고침 버튼 -->
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
​<!-- 음악 탭 UI -->
<div v-if="isMusicMode">
<div class="d-flex align-center gap-2 overflow-x-auto pb-3 mb-4">
<v-chip
v-for="cat in musicCategories"
:key="cat.value"
:color="musicCategory === cat.value ? 'deep-purple-darken-2' : 'default'"
class="text-white font-weight-bold glass-chip flex-shrink-0 cursor-pointer px-4"
@click="selectMusicCategory(cat.value)"
>
{{ cat.title }}
</v-chip>
</div>
​<div class="d-flex justify-space-between align-center mb-4 flex-wrap gap-2">
<div class="d-flex align-center gap-2">
<h2 class="text-subtitle-1 text-md-h6 font-weight-bold text-white ma-0">🎵 추천 및 검색된 음악 트랙</h2>
<div class="d-flex align-center gap-1">
<v-btn icon="mdi-download" size="x-small" variant="text" color="accent" title="음악 탭 데이터 백업" @click="downloadMusicBackup"></v-btn>
<v-btn icon="mdi-upload" size="x-small" variant="text" color="accent" title="음악 탭 데이터 불러오기" @click="triggerUploadMusic"></v-btn>
</div>
</div>
<div class="d-flex align-center gap-2">
<v-btn
color="deep-purple-darken-2"
variant="flat"
size="small"
prepend-icon="mdi-playlist-play"
class="text-white font-weight-bold rounded-pill px-4"
:disabled="displayedVideos.length === 0"
@click="playSelectedOrAllMusic"
>
음악 전체/선택 재생
</v-btn>
</div>
</div>
​<v-row v-if="isLoading && displayedVideos.length === 0" justify="center" align="center" style="min-height: 250px;">
<v-col cols="12" class="text-center">
<v-progress-circular indeterminate color="accent" size="48" class="mb-3"></v-progress-circular>
<h3 class="text-subtitle-1 text-grey-lighten-1 font-weight-bold">음악을 불러오는 중입니다...</h3>
</v-col>
</v-row>
​<v-row v-else-if="displayedVideos.length === 0" justify="center" align="center" style="min-height: 250px;">
<v-col cols="12" class="text-center">
<v-icon icon="mdi-music-note-off" size="56" class="text-grey-darken-2 mb-2"></v-icon>
<h3 class="text-subtitle-1 text-grey-lighten-1 font-weight-bold">표시할 음악이 없습니다</h3>
<p class="text-caption text-grey-darken-1 mt-1">상단 검색창에 가수나 곡명을 입력하고 엔터를 쳐서 검색해 보세요.</p>
</v-col>
</v-row>
​<div v-else class="d-flex flex-column gap-3">
<v-card
v-for="video in displayedVideos"
:key="video.id"
class="glass-card rounded-2xl pa-3 d-flex align-center justify-space-between position-relative playlist-list-item"
elevation="0"
@click="playVideo(video)"
>
<div class="d-flex align-center gap-3 overflow-hidden flex-grow-1 pr-2">
<v-checkbox
v-model="selectedVideoIds"
:value="video.id"
color="accent"
hide-details
density="compact"
class="ma-0 pa-0 flex-shrink-0"
@click.stop
></v-checkbox>
​<div class="playlist-thumb-wrapper position-relative bg-black rounded-xl overflow-hidden flex-shrink-0">
<v-img :src="video.thumbnail" width="110" height="62" cover>
<div v-if="video.duration > 0" class="video-duration-badge-small">{{ formatVideoDuration(video.duration) }}</div>
</v-img>
</div>
​<div class="overflow-hidden flex-grow-1">
<h3 class="text-white font-weight-bold text-body-2 text-md-subtitle-1 text-truncate mb-1" v-html="video.title"></h3>
<p class="text-grey-lighten-1 text-caption mb-0 text-truncate">
<span class="text-white creator-name-link font-weight-medium" @click.stop="selectCreatorFromVideo(video)" title="이 채널로 이동">{{ video.creatorName }}</span>
<span class="text-accent font-weight-medium">({{ getCreatorSubCount(video.creatorId, video) }})</span>
<span v-if="video.views > 0" class="text-grey-darken-1 ml-1">• {{ formatViewCount(video.views) }}</span>
</p>
</div>
</div>
​<div class="d-flex align-center gap-1 flex-shrink-0" @click.stop>
<v-btn
icon="mdi-folder-plus"
size="small"
variant="text"
color="accent"
title="재생 목록에 추가"
@click.stop="openSaveToPlaylistDialog(video)"
></v-btn>
<v-btn
icon="mdi-heart"
size="small"
variant="text"
:color="video.isFavorite ? 'pink' : 'grey'"
title="좋아요(즐겨찾기)"
@click.stop="toggleVideoFavorite(video)"
></v-btn>
</div>
</v-card>
</div>
</div>
​<!-- 재생 목록 폴더 및 카테고리 그룹 뷰 -->
<div v-else-if="isPlaylistMode && !activePlaylistId">
<v-row>
<!-- 왼쪽 카테고리 그룹 패널 -->
<v-col cols="12" md="3">
<v-card class="glass-card rounded-2xl pa-4 h-100" elevation="0">
<div class="d-flex justify-space-between align-center mb-3">
<h3 class="text-subtitle-2 font-weight-bold text-white ma-0">카테고리 그룹</h3>
<v-btn
icon="mdi-plus"
size="x-small"
variant="flat"
color="deep-purple-darken-2"
title="새 그룹 추가"
@click="openCreateGroupDialog"
></v-btn>
</div>
<v-divider class="border-opacity-25 mb-3"></v-divider>
<v-list density="compact" class="bg-transparent text-white nav-group-list">
<v-list-item
v-for="group in playlistGroups"
:key="group.id"
class="custom-list-item mb-1"
:class="{ 'neon-active': activeGroupId === group.id }"
@click="activeGroupId = group.id"
>
<template v-slot:prepend>
<v-icon icon="mdi-folder" size="18" class="mr-2 text-accent"></v-icon>
</template>
<v-list-item-title class="text-body-2">{{ group.name }}</v-list-item-title>
<template v-slot:append>
<v-btn
v-if="group.id !== 'g_default' && group.id !== 'g_music'"
icon="mdi-delete"
size="x-small"
variant="text"
color="red-lighten-2"
title="그룹 삭제"
@click.stop="deletePlaylistGroup(group)"
></v-btn>
</template>
</v-list-item>
</v-list>
</v-card>
</v-col>
​<!-- 오른쪽 재생 목록 폴더 목록 -->
<v-col cols="12" md="9">
<div class="d-flex justify-space-between align-center mb-4 flex-wrap gap-2">
<div class="d-flex align-center gap-2">
<h2 class="text-subtitle-1 text-md-h6 font-weight-bold text-white ma-0">
[{{ getCurrentGroupName() }}] 재생 목록 폴더
</h2>
<div class="d-flex align-center gap-1">
<v-btn icon="mdi-download" size="x-small" variant="text" color="accent" title="전체 재생 목록 백업" @click="downloadPlaylistsBackup"></v-btn>
<v-btn icon="mdi-upload" size="x-small" variant="text" color="accent" title="전체 재생 목록 불러오기" @click="triggerUploadPlaylists"></v-btn>
</div>
</div>
<v-btn
color="deep-purple-darken-2"
variant="flat"
size="small"
prepend-icon="mdi-folder-plus"
class="text-white font-weight-bold rounded-pill px-4"
@click="openCreatePlaylistDialog"
>
현재 그룹에 새 폴더 만들기
</v-btn>
</div>
​<v-row v-if="filteredPlaylists.length === 0" justify="center" align="center" style="min-height: 200px;">
<v-col cols="12" class="text-center">
<v-icon icon="mdi-folder-outline" size="56" class="text-grey-darken-2 mb-2"></v-icon>
<h3 class="text-subtitle-1 text-grey-lighten-1 font-weight-bold">이 그룹에 생성된 재생 목록 폴더가 없습니다</h3>
<p class="text-caption text-grey-darken-1 mt-1">상단의 '현재 그룹에 새 폴더 만들기' 버튼을 눌러 만들어 보세요.</p>
</v-col>
</v-row>
​<v-row v-else>
<v-col v-for="playlist in filteredPlaylists" :key="playlist.id" cols="12" sm="6" md="4">
<v-card
class="glass-card rounded-2xl pa-4 h-100 d-flex flex-column justify-space-between position-relative"
elevation="0"
@click="selectPlaylistFolder(playlist)"
>
<div>
<div class="d-flex justify-space-between align-start mb-3">
<v-icon icon="mdi-folder-music" color="accent" size="40"></v-icon>
<div class="d-flex align-center gap-1" @click.stop>
<!-- 그룹 이동 메뉴 -->
<v-menu location="bottom end">
<template v-slot:activator="{ props }">
<v-btn v-bind="props" icon="mdi-folder-move" size="x-small" variant="text" color="accent" title="다른 카테고리 그룹으로 이동"></v-btn>
</template>
<v-list density="compact" class="glass-modal rounded-xl py-1" width="160">
<v-list-item
v-for="g in playlistGroups"
:key="g.id"
@click="movePlaylistToGroup(playlist, g.id)"
:class="{ 'text-accent': (playlist.groupId || 'g_default') === g.id }"
>
<v-list-item-title class="text-body-2 text-white">{{ g.name }}</v-list-item-title>
</v-list-item>
</v-list>
</v-menu>
​<v-btn icon="mdi-download" size="x-small" variant="text" color="accent" title="이 폴더 개별 백업" @click="downloadSinglePlaylistBackup(playlist)"></v-btn>
<v-btn icon="mdi-upload" size="x-small" variant="text" color="accent" title="이 폴더로 개별 불러오기" @click="triggerUploadSinglePlaylist(playlist)"></v-btn>
<v-btn
icon="mdi-pencil"
size="x-small"
variant="text"
color="accent"
title="폴더 이름 및 그룹 수정"
@click="openEditPlaylistDialog(playlist)"
></v-btn>
<v-btn
icon="mdi-delete"
size="x-small"
variant="text"
color="red-lighten-2"
title="폴더 삭제"
@click="deletePlaylist(playlist)"
></v-btn>
</div>
</div>
<h3 class="text-white font-weight-bold text-subtitle-1 mb-1 text-truncate">{{ playlist.name }}</h3>
<p class="text-grey-lighten-1 text-caption mb-0">동영상 {{ getPlaylistVideoCount(playlist.id) }}개</p>
</div>
​<div class="mt-3" @click.stop>
<v-checkbox
v-model="playlistResumeStates[playlist.id]"
color="accent"
label="이 폴더 이어보기"
density="compact"
hide-details
class="text-caption ma-0 pa-0 text-white"
@change="savePlaylistResumeState(playlist.id)"
></v-checkbox>
</div>
​<div class="d-flex justify-space-between align-center mt-4" @click.stop>
<v-btn
v-if="playlistResumeStates[playlist.id] && hasPlaylistResumeMemory(playlist.id)"
size="x-small"
variant="text"
color="accent"
class="pa-0 text-caption font-weight-bold"
@click="clearPlaylistResumeMemory(playlist.id)"
title="기억된 이어보기 위치 초기화"
>
이어보기 초기화
</v-btn>
<div v-else></div>
​<v-btn
size="small"
variant="flat"
color="deep-purple-darken-2"
class="text-white font-weight-bold rounded-pill px-4"
@click.stop="playPlaylistFolder(playlist)"
:disabled="getPlaylistVideoCount(playlist.id) === 0"
>
전체 재생
</v-btn>
</div>
</v-card>
</v-col>
</v-row>
</v-col>
</v-row>
</div>
​<!-- 재생 목록 폴더 내부 뷰 -->
<template v-else-if="isPlaylistMode && activePlaylistId">
<div class="mb-4 d-flex align-center justify-space-between flex-wrap gap-2">
<v-btn
variant="text"
color="accent"
size="small"
prepend-icon="mdi-arrow-left"
class="font-weight-bold"
@click="activePlaylistId = null"
>
재생 목록 폴더 목록으로 돌아가기
</v-btn>
​<div class="d-flex align-center gap-3">
<v-checkbox
v-model="playlistResumeStates[activePlaylistId]"
color="accent"
label="이어보기 사용"
density="compact"
hide-details
class="text-caption ma-0 pa-0 text-white"
@change="savePlaylistResumeState(activePlaylistId)"
></v-checkbox>
​<v-btn
color="deep-purple-darken-2"
variant="flat"
size="small"
prepend-icon="mdi-play"
class="text-white font-weight-bold rounded-pill px-4"
:disabled="displayedVideos.length === 0"
@click="playPlaylistFolder({ id: activePlaylistId })"
>
재생 목록 전체 재생
</v-btn>
</div>
</div>
​<v-row v-if="displayedVideos.length === 0" justify="center" align="center" style="min-height: 250px;">
<v-col cols="12" class="text-center">
<v-icon icon="mdi-play-box-outline" size="56" class="text-grey-darken-2 mb-2"></v-icon>
<h3 class="text-subtitle-1 text-grey-lighten-1 font-weight-bold">이 재생 목록에 담긴 영상이 없습니다</h3>
</v-col>
</v-row>
​<div v-else class="d-flex flex-column gap-3">
<v-card
v-for="(video, index) in displayedVideos"
:key="video.id"
class="glass-card rounded-2xl pa-3 d-flex align-center justify-space-between position-relative playlist-list-item"
elevation="0"
draggable="true"
@dragstart="onDragStart(index)"
@dragover.prevent
@drop="onDrop(index)"
@click="playVideo(video)"
>
<div class="d-flex align-center gap-3 overflow-hidden flex-grow-1 pr-2">
<v-icon icon="mdi-drag" color="grey-darken-1" size="20" class="cursor-grab flex-shrink-0" title="드래그하여 순서 변경"></v-icon>
​<v-checkbox
v-model="selectedVideoIds"
:value="video.id"
color="accent"
hide-details
density="compact"
class="ma-0 pa-0 flex-shrink-0"
@click.stop
></v-checkbox>
​<div class="playlist-thumb-wrapper position-relative bg-black rounded-xl overflow-hidden flex-shrink-0">
<v-img :src="video.thumbnail" width="110" height="62" cover>
<div v-if="video.duration > 0" class="video-duration-badge-small">{{ formatVideoDuration(video.duration) }}</div>
</v-img>
</div>
​<div class="overflow-hidden flex-grow-1">
<h3 class="text-white font-weight-bold text-body-2 text-md-subtitle-1 text-truncate mb-1" v-html="video.title"></h3>
<p class="text-grey-lighten-1 text-caption mb-0 text-truncate">
<span class="text-white creator-name-link font-weight-medium" @click.stop="selectCreatorFromVideo(video)" title="이 채널로 이동">{{ video.creatorName }}</span>
<span class="text-accent font-weight-medium">({{ getCreatorSubCount(video.creatorId, video) }})</span>
<span v-if="video.views > 0" class="text-grey-darken-1 ml-1">• {{ formatViewCount(video.views) }}</span>
</p>
</div>
</div>
​<div class="d-flex align-center gap-1 flex-shrink-0" @click.stop>
<v-btn
icon="mdi-arrow-up"
size="x-small"
variant="text"
color="white"
:disabled="index === 0"
title="위로 이동"
@click="movePlaylistItemOrder(index, -1)"
></v-btn>
<v-btn
icon="mdi-arrow-down"
size="x-small"
variant="text"
color="white"
:disabled="index === displayedVideos.length - 1"
title="아래로 이동"
@click="movePlaylistItemOrder(index, 1)"
></v-btn>
<v-btn
icon="mdi-delete"
size="small"
variant="text"
color="red-lighten-2"
title="재생 목록에서 제거"
@click="removeVideoFromActivePlaylist(video)"
></v-btn>
</div>
</v-card>
</div>
</template>
​<!-- 일반 영상 목록 뷰 -->
<template v-else>
<v-row v-if="isLoading && displayedVideos.length === 0" justify="center" align="center" style="min-height: 250px;">
<v-col cols="12" class="text-center">
<v-progress-circular indeterminate color="accent" size="48" class="mb-3"></v-progress-circular>
<h3 class="text-subtitle-1 text-grey-lighten-1 font-weight-bold">영상을 불러오는 중입니다...</h3>
</v-col>
</v-row>
​<v-row v-else-if="displayedVideos.length === 0" justify="center" align="center" style="min-height: 250px;">
<v-col cols="12" class="text-center">
<v-icon icon="mdi-play-box-outline" size="56" class="text-grey-darken-2 mb-2"></v-icon>
<h3 class="text-subtitle-1 text-grey-lighten-1 font-weight-bold">표시할 콘텐츠가 없습니다</h3>
<p class="text-caption text-grey-darken-1 mt-1">
{{ isAlgorithmMode ? '구독 중인 채널이 없거나 시청 기록이 적습니다.' : (isSearchMode ? '검색된 결과가 없습니다. 상단 바에 검색어를 입력하고 엔터를 쳐보세요.' : (isHistoryMode ? '시청한 기록이 없습니다. 영상을 시청해 보세요.' : (isFavoriteVideosMode ? '즐겨찾기(좋아요)한 영상이 없습니다.' : (isTrendingMode ? '실시간 급상승 영상을 불러오지 못했습니다.' : (currentTab === 'discoverHeart' ? '구독 피드 모음에 등록된 하트 크리에이터가 없거나 저장된 영상이 없습니다. 돋보기/엔터 키로 최신 영상을 불러오세요.' : '구독 중인 채널의 저장된 영상이 없습니다. 돋보기/엔터 키로 최신 영상을 불러오세요.'))))) }}
</p>
</v-col>
</v-row>
​<template v-else>
<div v-if="isFavoriteVideosMode" class="d-flex align-center justify-end mb-3 px-1">
<v-checkbox
v-model="favoriteVideosContinueEnabled"
color="accent"
label="이어보기"
density="compact"
hide-details
class="text-caption ma-0 pa-0 text-white"
></v-checkbox>
</div>
<!-- 시청 기록 탭 리스트 뷰 -->
<div v-if="isHistoryMode" class="d-flex flex-column gap-3">
<v-card
v-for="video in displayedVideos"
:key="video.id"
class="glass-card rounded-2xl pa-3 d-flex align-center justify-space-between position-relative playlist-list-item"
elevation="0"
@click="playVideo(video)"
>
<div class="d-flex align-center gap-3 overflow-hidden flex-grow-1 pr-2">
<div class="playlist-thumb-wrapper position-relative bg-black rounded-xl overflow-hidden flex-shrink-0">
<v-img :src="video.thumbnail" width="110" height="62" cover>
<div v-if="video.duration > 0" class="video-duration-badge-small">{{ formatVideoDuration(video.duration) }}</div>
<div v-if="video.progressPercent > 0" class="video-progress-bar-container">
<div class="video-progress-bar-fill" :style="{ width: video.progressPercent + '%' }"></div>
</div>
</v-img>
</div>
<div class="overflow-hidden flex-grow-1">
<h3 class="text-white font-weight-bold text-body-2 text-md-subtitle-1 text-truncate mb-1" v-html="video.title"></h3>
<div class="d-flex align-center gap-2 flex-wrap">
<p class="text-grey-lighten-1 text-caption mb-0 text-truncate">
<span class="text-white creator-name-link font-weight-medium" @click.stop="selectCreatorFromVideo(video)" title="이 채널로 이동">{{ video.creatorName }}</span>
<span class="text-accent font-weight-medium">({{ getCreatorSubCount(video.creatorId, video) }})</span>
<span v-if="video.views > 0" class="text-grey-darken-1 ml-1">• {{ formatViewCount(video.views) }}</span>
</p>
<span class="text-grey-darken-1 text-caption">• 시청일: {{ formatRelativeTime(video.historyUpdatedAt) }}</span>
</div>
</div>
</div>
​<div class="d-flex align-center flex-shrink-0" @click.stop>
<v-btn
icon="mdi-delete"
size="small"
variant="text"
color="red-lighten-2"
title="시청 기록에서 삭제"
@click="deleteHistoryRecord(video)"
></v-btn>
</div>
</v-card>
</div>
​<!-- 일반 그리드 뷰 -->
<template v-else>
<div v-if="shortsVideos.length > 0" class="mb-6">
<div class="d-flex align-center mb-3">
<v-icon icon="mdi-lightning-bolt" color="red" class="mr-2" size="22"></v-icon>
<h2 class="text-subtitle-1 text-md-h6 font-weight-bold text-white ma-0">Shorts</h2>
</div>
<div class="shorts-horizontal-scroll">
<div
v-for="video in shortsVideos"
:key="video.id"
class="shorts-card glass-card rounded-2xl overflow-hidden d-flex flex-column flex-shrink-0 position-relative"
@click="playVideo(video)"
>
<div class="video-checkbox-wrapper">
<v-checkbox
v-model="selectedVideoIds"
:value="video.id"
color="accent"
hide-details
density="compact"
class="ma-1 pa-0 bg-dark-glass rounded"
@click.stop
></v-checkbox>
</div>
​<div class="shorts-thumbnail-wrapper position-relative bg-black">
<v-img :src="video.thumbnail" height="220" cover class="align-end">
<div class="shorts-badge">Shorts</div>
<div v-if="video.duration > 0" class="video-duration-badge-left">{{ formatVideoDuration(video.duration) }}</div>
<div v-if="video.progressPercent > 0" class="video-progress-bar-container">
<div class="video-progress-bar-fill" :style="{ width: video.progressPercent + '%' }"></div>
</div>
</v-img>
<div class="play-overlay">
<div class="play-btn-circle">
<v-icon icon="mdi-play" color="white" size="32"></v-icon>
</div>
</div>
</div>
<div class="pa-3 d-flex flex-column justify-space-between flex-grow-1">
<h3 class="text-white font-weight-bold text-caption text-truncate-2 mb-2" v-html="video.title"></h3>
<div class="d-flex flex-column gap-1">
<div class="d-flex justify-space-between align-center">
<p class="text-grey-lighten-1 text-caption mb-0 text-truncate">
<span class="text-white creator-name-link font-weight-medium" @click.stop="selectCreatorFromVideo(video)" title="이 채널로 이동">{{ video.creatorName }}</span>
<span class="text-accent">({{ getCreatorSubCount(video.creatorId, video) }})</span>
</p>
<div class="d-flex align-center">
<v-btn
icon="mdi-folder-plus"
size="x-small"
variant="text"
color="accent"
title="재생 목록에 추가"
@click.stop="openSaveToPlaylistDialog(video)"
></v-btn>
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
<span v-if="video.views > 0" class="text-grey-darken-1 text-caption">{{ formatViewCount(video.views) }}</span>
</div>
</div>
</div>
</div>
</div>
​<div v-if="normalVideos.length > 0">
<div v-if="shortsVideos.length > 0" class="d-flex align-center mb-3">
<v-icon icon="mdi-youtube" color="red" class="mr-2" size="22"></v-icon>
<h2 class="text-subtitle-1 text-md-h6 font-weight-bold text-white ma-0">동영상</h2>
</div>
<v-row>
<v-col v-for="video in normalVideos" :key="video.id" cols="12" sm="6" md="4" lg="3">
<v-card class="glass-card rounded-2xl overflow-hidden h-100 d-flex flex-column mb-3 mb-sm-0 position-relative" elevation="0" @click="playVideo(video)">
<div class="video-checkbox-wrapper">
<v-checkbox
v-model="selectedVideoIds"
:value="video.id"
color="accent"
hide-details
density="compact"
class="ma-1.5 pa-0 bg-dark-glass rounded"
@click.stop
></v-checkbox>
</div>
​<div class="video-thumbnail-wrapper position-relative bg-black">
<v-img :src="video.thumbnail" class="video-thumb-img align-end" cover>
<div v-if="video.duration > 0" class="video-duration-badge-left">{{ formatVideoDuration(video.duration) }}</div>
<div v-if="video.progressPercent > 0" class="video-progress-bar-container">
<div class="video-progress-bar-fill" :style="{ width: video.progressPercent + '%' }"></div>
</div>
</v-img>
<div class="play-overlay">
<div class="play-btn-circle shorts-play-btn">
<v-icon icon="mdi-play" color="white" size="28"></v-icon>
</div>
</div>
</div>
​<v-card-text class="flex-grow-1 d-flex flex-column justify-space-between pa-3 pa-md-4">
<div class="d-flex justify-space-between align-start gap-2">
<div class="flex-grow-1 overflow-hidden">
<h3 class="text-white font-weight-bold text-body-2 text-md-subtitle-1 mb-1 text-truncate-2" v-html="video.title"></h3>
<p class="text-grey-lighten-1 text-caption mb-0 text-truncate">
<span class="text-white creator-name-link font-weight-medium" @click.stop="selectCreatorFromVideo(video)" title="이 채널로 이동">{{ video.creatorName }}</span>
<span class="text-accent font-weight-medium">({{ getCreatorSubCount(video.creatorId, video) }})</span>
</p>
</div>
<div class="d-flex flex-column align-end flex-shrink-0 text-right" style="min-width: 95px;">
<span class="text-grey-darken-1 text-caption mb-0.5">{{ formatRelativeTime(video.publishedAt) }}</span>
<span v-if="video.views > 0" class="text-grey-darken-1 text-caption mb-1">{{ formatViewCount(video.views) }}</span>
<div class="d-flex align-center">
<v-btn
icon="mdi-folder-plus"
size="x-small"
variant="text"
color="accent"
title="재생 목록에 추가"
@click.stop="openSaveToPlaylistDialog(video)"
></v-btn>
<v-btn
icon="mdi-heart"
size="x-small"
variant="text"
:color="video.isFavorite ? 'pink' : 'grey'"
title="영상 즐겨찾기"
@click.stop="toggleVideoFavorite(video)"
></v-btn>
<v-btn
icon="mdi-account-plus"
size="x-small"
variant="text"
:color="creators.some(c => c.id === video.creatorId) ? 'accent' : 'grey'"
:title="creators.some(c => c.id === video.creatorId) ? '구독 중 (누르면 구독 취소)' : '이 채널 구독하기'"
@click.stop="toggleSubscribeFromCard(video)"
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
</template>
</template>
​</v-container>
​<v-slide-y-transition>
<v-btn
v-if="showMainScrollTop"
icon="mdi-chevron-up"
size="small"
color="deep-purple-darken-2"
variant="flat"
class="main-scroll-top-fab text-white rounded-circle"
title="최상위로 이동"
@click.stop.prevent="scrollToTop(mainScrollRef)"
@touchend.stop.prevent="scrollToTop(mainScrollRef)"
>
<v-icon icon="mdi-chevron-up" color="white" size="24"></v-icon>
</v-btn>
</v-slide-y-transition>
</v-main>
​<!-- 로딩 오버레이 -->
<div v-if="isLoading" class="loading-overlay-container">
<div class="loading-card glass-modal pa-6 rounded-2xl d-flex flex-column align-center shadow-lg">
<v-progress-circular indeterminate color="accent" size="48" width="4" class="mb-3"></v-progress-circular>
<h3 class="text-subtitle-1 text-white font-weight-bold mb-1">조회 중입니다...</h3>
<p class="text-caption text-grey-lighten-1 mb-0">잠시만 기다려 주세요.</p>
</div>
</div>
​<!-- 재생 목록 그룹 생성 다이얼로그 -->
<v-dialog v-model="isGroupDialogVisible" max-width="380px">
<v-card class="glass-modal rounded-2xl pa-5 text-white">
<h3 class="text-subtitle-1 font-weight-bold mb-3">새 카테고리 그룹 생성</h3>
<v-text-field
v-model="groupFormName"
label="그룹 이름"
variant="outlined"
density="compact"
class="mb-3"
@keydown.enter="createPlaylistGroup"
></v-text-field>
<div class="d-flex justify-end gap-2">
<v-btn variant="text" color="grey-lighten-1" size="small" @click="isGroupDialogVisible = false">취소</v-btn>
<v-btn color="deep-purple-darken-2" variant="flat" size="small" class="text-white font-weight-bold rounded-pill px-4" @click="createPlaylistGroup">생성</v-btn>
</div>
</v-card>
</v-dialog>
​<!-- 재생 목록 생성/수정 다이얼로그 -->
<v-dialog v-model="isPlaylistDialogVisible" max-width="400px">
<v-card class="glass-modal rounded-2xl pa-5 text-white">
<h3 class="text-subtitle-1 font-weight-bold mb-3">{{ editingPlaylist ? '재생 목록 폴더 이름 및 그룹 수정' : '새 재생 목록 폴더 생성' }}</h3>
<v-text-field
v-model="playlistFormName"
label="폴더 이름"
variant="outlined"
density="compact"
class="mb-3"
@keydown.enter="savePlaylistFolder"
></v-text-field>
<v-select
v-model="playlistFormGroupId"
:items="playlistGroups"
item-title="name"
item-value="id"
label="카테고리 그룹 선택"
variant="outlined"
density="compact"
class="mb-3 text-white"
></v-select>
<div class="d-flex justify-end gap-2">
<v-btn variant="text" color="grey-lighten-1" size="small" @click="isPlaylistDialogVisible = false">취소</v-btn>
<v-btn color="deep-purple-darken-2" variant="flat" size="small" class="text-white font-weight-bold rounded-pill px-4" @click="savePlaylistFolder">저장</v-btn>
</div>
</v-card>
</v-dialog>
​<!-- 영상 -> 재생 목록에 저장 다이얼로그 -->
<v-dialog v-model="isSaveToPlaylistDialogVisible" max-width="420px">
<v-card class="glass-modal rounded-2xl pa-5 text-white">
<h3 class="text-subtitle-1 font-weight-bold mb-3">재생 목록에 저장</h3>
​<div v-if="playlists.length === 0" class="text-grey-darken-1 text-caption mb-3">
생성된 재생 목록 폴더가 없습니다. 아래에서 새 폴더를 만들어 보세요.
</div>
<v-list v-else density="compact" class="bg-transparent text-white mb-2" style="max-height: 180px; overflow-y: auto;">
<v-list-item v-for="pl in playlists" :key="pl.id" class="px-0">
<template v-slot:prepend>
<v-checkbox
v-model="targetPlaylistIds"
:value="pl.id"
color="accent"
density="compact"
hide-details
></v-checkbox>
</template>
<v-list-item-title class="text-body-2">{{ pl.name }}</v-list-item-title>
</v-list-item>
</v-list>
​<v-divider class="border-opacity-25 my-3"></v-divider>
​<div class="mb-3">
<span class="text-caption text-accent font-weight-bold d-block mb-1">➕ 새 폴더 바로 만들기</span>
<div class="d-flex align-center gap-2">
<v-text-field
v-model="quickNewPlaylistName"
placeholder="새 폴더 이름 입력"
variant="outlined"
density="compact"
hide-details
class="flex-grow-1"
@keydown.enter="quickCreateAndSelectPlaylist"
></v-text-field>
<v-btn
color="deep-purple-darken-2"
variant="flat"
size="small"
class="text-white font-weight-bold flex-shrink-0 rounded-pill px-3"
@click="quickCreateAndSelectPlaylist"
>
폴더 생성
</v-btn>
</div>
</div>
​<div class="d-flex justify-end gap-2 mt-3">
<v-btn variant="text" color="grey-lighten-1" size="small" @click="isSaveToPlaylistDialogVisible = false">취소</v-btn>
<v-btn color="deep-purple-darken-2" variant="flat" size="small" class="text-white font-weight-bold rounded-pill px-4" @click="confirmSaveToPlaylists">확인</v-btn>
</div>
</v-card>
</v-dialog>
​<!-- 현재 재생 리스트 보기 모달 -->
<v-dialog v-model="isQueueModalOpen" max-width="500px">
<v-card class="glass-modal rounded-2xl pa-5 text-white">
<div class="d-flex justify-space-between align-center mb-3">
<h3 class="text-subtitle-1 font-weight-bold">📋 현재 재생 리스트 ({{ playlistQueue.length }}개)</h3>
<div class="d-flex align-center gap-2">
<v-btn
icon="mdi-shuffle"
size="small"
variant="flat"
color="deep-purple-darken-2"
class="rounded-circle"
title="리스트 무작위 섞기 (랜덤 재생)"
@click="shufflePlaylistQueue"
></v-btn>
<v-btn icon="mdi-close" variant="text" size="small" @click="isQueueModalOpen = false"></v-btn>
</div>
</div>
​<div style="max-height: 350px; overflow-y: auto;" class="d-flex flex-column gap-2">
<div
v-for="(item, idx) in playlistQueue"
:key="item.id + '_' + idx"
class="d-flex align-center justify-space-between pa-2.5 rounded-xl cursor-pointer"
:class="{ 'neon-active': idx === playlistIndex }"
@click="playQueueIndex(idx)"
>
<div class="d-flex align-center gap-3 overflow-hidden">
<span class="text-accent text-caption font-weight-bold">{{ idx + 1 }}</span>
<v-img :src="item.thumbnail" width="68" height="38" cover class="rounded-lg flex-shrink-0 bg-black"></v-img>
<div class="overflow-hidden">
<p class="text-caption text-white font-weight-bold text-truncate mb-0">{{ item.title }}</p>
<p class="text-grey-lighten-1 text-caption mb-0">{{ item.creatorName }}</p>
</div>
</div>
<v-icon v-if="idx === playlistIndex" icon="mdi-play-circle" color="accent" size="22"></v-icon>
</div>
</div>
</v-card>
</v-dialog>
​<!-- 시네마틱 영상 재생 모달 -->
<v-dialog v-model="isPlayerOpen" max-width="880px" width="100%" :scrim="false" persistent class="safe-player-dialog" eager @update:model-value="onDialogModelUpdate">
<v-card class="glass-modal rounded-2xl overflow-hidden pa-0" :class="{ 'player-compact-mode': isPlayerCompactMode, 'player-floating-mode': isPlayerCompactMode && isFloatingPlayerMode }" :style="isPlayerCompactMode && isFloatingPlayerMode ? floatingPlayerStyle : null">
<div class="d-flex justify-space-between align-center px-3 py-2 px-md-5 bg-glass-bar mobile-tight-header" :class="{ 'player-floating-header': isPlayerCompactMode && isFloatingPlayerMode }">
<div
class="d-flex align-center overflow-hidden pr-2 player-drag-handle"
:class="{ 'is-draggable': isPlayerCompactMode && isFloatingPlayerMode }"
@pointerdown="startPlayerDrag"
>
<span v-if="playlistQueue.length > 1 && !(isPlayerCompactMode && isFloatingPlayerMode)" class="text-accent text-caption font-weight-bold mr-2 flex-shrink-0">
[{{ playlistIndex + 1 }}/{{ playlistQueue.length }}]
</span>
<span class="text-white font-weight-bold text-caption text-md-subtitle-1 text-truncate">{{ activeVideo?.title }}</span>
</div>
<div class="d-flex align-center flex-shrink-0 player-header-actions">
<v-btn
icon
variant="text"
size="small"
:color="isLoopMode ? 'accent' : 'white'"
class="mr-1"
:title="isLoopMode ? '반복 재생 켜짐 (한 영상 무한 반복)' : '반복 재생 꺼짐'"
@click="toggleLoopMode"
>
<v-icon :icon="isLoopMode ? 'mdi-repeat-once' : 'mdi-repeat'" size="20"></v-icon>
</v-btn>
​<v-btn icon="mdi-shuffle" variant="text" size="small" color="accent" class="mr-1" title="재생 리스트 무작위 섞기" @click="shufflePlaylistQueue"></v-btn>
<v-btn icon="mdi-playlist-music-outline" variant="text" size="small" color="white" class="mr-1" title="현재 재생 리스트 보기" @click="isQueueModalOpen = true"></v-btn>
​<v-btn v-if="playlistQueue.length > 1" icon="mdi-skip-previous" variant="text" size="small" color="white" :disabled="playlistIndex <= 0" @click="playPreviousInQueue"></v-btn>
<v-btn v-if="playlistQueue.length > 1" icon="mdi-skip-next" variant="text" size="small" color="white" :disabled="playlistIndex >= playlistQueue.length - 1" @click="playNextInQueue" class="mr-2"></v-btn>
​<!-- 취침 예약 -->
<v-menu location="bottom end" :close-on-content-click="false">
<template v-slot:activator="{ props }">
<v-btn
v-bind="props"
icon
variant="text"
size="small"
:color="sleepTimerSecondsLeft > 0 ? 'accent' : 'white'"
class="mr-1"
title="취침 예약 설정"
>
<v-badge v-if="sleepTimerSecondsLeft > 0" dot color="accent" offset-x="-2" offset-y="-2">
<v-icon icon="mdi-sleep" size="20"></v-icon>
</v-badge>
<v-icon v-else icon="mdi-sleep" size="20"></v-icon>
</v-btn>
</template>
<v-list density="compact" class="glass-modal rounded-xl py-2 text-white" width="220">
<v-list-item class="px-3 py-1">
<v-list-item-title class="font-weight-bold text-caption text-accent">
{{ sleepTimerSecondsLeft > 0 ? ⏰ 남은 시간: ${formatSleepTime(sleepTimerSecondsLeft)} : '취침 예약 설정' }}
</v-list-item-title>
</v-list-item>
<v-divider class="border-opacity-25 my-1"></v-divider>
​<v-list-item class="px-3 py-1">
<div class="d-flex align-center gap-1 w-100">
<v-text-field
v-model.number="customSleepMinutes"
type="number"
density="compact"
variant="outlined"
hide-details
class="custom-jump-input flex-grow-1"
placeholder="분"
min="1"
@keydown.enter="setCustomSleepTimer"
></v-text-field>
<span class="text-caption text-white mr-1">분</span>
<v-btn size="small" color="accent" variant="outlined" class="px-2 rounded-pill" @click="setCustomSleepTimer">적용</v-btn>
</div>
</v-list-item>
​<v-divider class="border-opacity-25 my-1"></v-divider>
<v-list-item value="10" @click="setSleepTimer(10)"><v-list-item-title class="text-body-2">10분 후</v-list-item-title></v-list-item>
<v-list-item value="30" @click="setSleepTimer(30)"><v-list-item-title class="text-body-2">30분 후</v-list-item-title></v-list-item>
<v-list-item value="60" @click="setSleepTimer(60)"><v-list-item-title class="text-body-2">1시간 후</v-list-item-title></v-list-item>
<v-list-item value="120" @click="setSleepTimer(120)"><v-list-item-title class="text-body-2">2시간 후</v-list-item-title></v-list-item>
<v-divider v-if="sleepTimerSecondsLeft > 0" class="border-opacity-25 my-1"></v-divider>
<v-list-item v-if="sleepTimerSecondsLeft > 0" value="off" @click="cancelSleepTimer" class="text-red-lighten-2">
<v-list-item-title class="text-body-2 font-weight-bold">타이머 해제</v-list-item-title>
</v-list-item>
</v-list>
</v-menu>
​<v-btn
icon
variant="text"
size="small"
:color="isAudioOnlyMode ? 'deep-purple-accent-2' : 'white'"
class="mr-1"
:title="isAudioOnlyMode ? '라디오 모드 해제 (영상 표시)' : '라디오 모드 (영상 숨기고 오디오 재생)'"
@click="toggleAudioOnlyMode"
>
<v-icon :icon="isAudioOnlyMode ? 'mdi-radio-handheld' : 'mdi-radio-tower'" size="20"></v-icon>
</v-btn>
​<v-menu v-if="isPlayerCompactMode && isFloatingPlayerMode" location="bottom end" :close-on-content-click="false">
<template v-slot:activator="{ props }">
<v-btn
v-bind="props"
icon="mdi-resize"
variant="text"
size="small"
color="white"
class="mr-1"
title="플로팅 영상 크기 조절"
></v-btn>
</template>
<v-card class="glass-modal rounded-xl pa-4" width="260">
<div class="d-flex align-center justify-space-between mb-2">
<span class="text-white text-caption font-weight-bold">영상 크기</span>
<span class="text-accent text-caption font-weight-bold">{{ floatingPlayerWidth }} px</span>
</div>
<v-slider
:model-value="floatingPlayerWidth"
:min="floatingMinWidth"
:max="floatingMaxWidth"
:step="10"
color="deep-purple-accent-2"
density="compact"
hide-details
@update:model-value="setFloatingPlayerWidth"
></v-slider>
<div class="d-flex justify-space-between text-grey-lighten-1 text-caption">
<span>작게</span><span>크게</span>
</div>
</v-card>
</v-menu>
​<v-btn
v-if="isPlayerCompactMode"
:icon="isFloatingPlayerMode ? 'mdi-dock-top' : 'mdi-picture-in-picture-bottom-right-outline'"
variant="text"
size="small"
color="white"
class="mr-1"
:title="isFloatingPlayerMode ? '상단 고정 모드로 돌아가기' : '자유 이동 플로팅 모드'"
@click="toggleFloatingPlayerMode"
></v-btn>
​<v-btn
:icon="isPlayerCompactMode ? 'mdi-arrow-expand' : 'mdi-arrow-collapse'"
variant="text"
size="small"
color="white"
class="mr-1"
:title="isPlayerCompactMode ? '플레이어 상세 화면 펼치기' : '목록 스크롤 모드로 전환'"
@click="togglePlayerCompactMode"
></v-btn>
<v-btn icon="mdi-close" variant="text" size="x-small" color="white" @click="closePlayer"></v-btn>
</div>
</div>
​<div ref="modalScrollRef" class="modal-vertical-container position-relative" @scroll="checkModalScroll">
<div 
class="video-container" 
:class="{ 'audio-only-hidden': isAudioOnlyMode }"
>
<div id="youtube-player-div" class="youtube-iframe"></div>
<div
v-if="isPlayerCompactMode && isFloatingPlayerMode && !isAudioOnlyMode"
class="floating-resize-handle"
role="button"
aria-label="영상 크기 조절"
title="드래그하여 영상 크기 조절"
@pointerdown.stop.prevent="startPlayerResize"
>
<v-icon icon="mdi-arrow-bottom-right" size="18"></v-icon>
</div>
</div>
​<div v-if="isAudioOnlyMode" class="radio-placeholder-card pa-6 text-center d-flex flex-column align-center justify-center">
<v-icon icon="mdi-radio-tower" size="56" color="accent" class="pulse-icon mb-3"></v-icon>
<h3 class="text-subtitle-1 font-weight-bold text-white mb-1">📻 라디오 전용 오디오 모드 재생 중</h3>
<p class="text-caption text-grey-lighten-1 mb-0">영상은 숨겨지고 오디오만 연속 재생 중입니다.</p>
</div>
​<div class="pa-4 pa-md-5 bg-glass-bar d-flex justify-space-between align-center flex-wrap gap-3 border-bottom-glass">
<div class="flex-grow-1 overflow-hidden pr-2">
<div class="d-flex align-center flex-wrap gap-2 mb-1">
<h3 class="text-white text-caption text-md-subtitle-2 font-weight-bold ma-0" v-html="activeVideo?.title"></h3>
<v-btn
color="red"
variant="flat"
size="x-small"
prepend-icon="mdi-youtube"
:href="`https://www.youtube.com/watch?v=${activeVideo?.youtubeId}`"
target="_blank"
class="text-white font-weight-bold rounded-pill"
>
유튜브에서 직접 보기
</v-btn>
</div>
<div class="d-flex align-center gap-2 mt-2">
<p class="text-grey-lighten-1 text-caption mb-0">
<span class="text-white creator-name-link font-weight-medium" @click.stop="selectCreatorFromVideo(activeVideo)" title="이 채널로 이동">{{ activeVideo?.creatorName }}</span>
<span class="text-accent font-weight-medium">({{ getCreatorSubCount(activeVideo?.creatorId, activeVideo) }})</span>
<span v-if="activeVideo?.views > 0" class="text-grey-darken-1 ml-1">• {{ formatViewCount(activeVideo.views) }}</span>
</p>
<div class="d-flex align-center gap-1">
<v-btn
size="x-small"
variant="outlined"
color="accent"
class="rounded-pill"
:prepend-icon="creators.some(c => c.id === activeVideo?.creatorId) ? 'mdi-check' : 'mdi-account-plus'"
@click="toggleSubscribeFromPlayer"
>
{{ creators.some(c => c.id === activeVideo?.creatorId) ? '구독중' : '구독' }}
</v-btn>
<v-btn
size="x-small"
variant="text"
color="red-lighten-2"
icon="mdi-open-in-new"
:href="`https://www.youtube.com/channel/${activeVideo?.creatorId}`"
target="_blank"
title="유튜브에서 채널 열기"
></v-btn>
</div>
</div>
​<div class="d-flex align-center gap-2 mt-2">
<v-checkbox
v-model="enableResume"
color="accent"
label="이어보기"
density="compact"
hide-details
class="text-caption ma-0 pa-0 text-white"
@change="saveResumeSetting"
></v-checkbox>
</div>
</div>
​<div class="d-flex align-center jump-box-container pa-2 px-3 rounded-xl">
<span class="text-caption text-grey-lighten-1 mr-2 flex-shrink-0 font-weight-medium">시간 제어:</span>
<div class="d-flex align-center mr-1">
<v-text-field
v-model.number="jumpMinutes"
type="number"
density="compact"
variant="outlined"
hide-details
class="custom-jump-input text-center mr-1"
placeholder="0"
min="0"
@paste="handleTimePaste"
></v-text-field>
<span class="text-caption text-white">분</span>
</div>
<div class="d-flex align-center mr-2">
<v-text-field
v-model.number="jumpSeconds"
type="number"
density="compact"
variant="outlined"
hide-details
class="custom-jump-input text-center mr-1"
placeholder="0"
min="0"
max="59"
@paste="handleTimePaste"
></v-text-field>
<span class="text-caption text-white">초</span>
</div>
<div class="d-flex align-center gap-1">
<v-btn color="accent" variant="flat" size="small" class="px-2 rounded-pill" @click="jumpToTime">이동</v-btn>
<v-btn color="blue-grey-darken-2" variant="flat" size="small" class="px-2 rounded-pill font-weight-bold" @click="cumulativeJump(-1)">- 이전</v-btn>
<v-btn color="amber-darken-2" variant="flat" size="small" class="px-2 rounded-pill font-weight-bold" @click="cumulativeJump(1)">+ 이후</v-btn>
</div>
</div>
​<div>
<v-btn color="accent" variant="outlined" size="small" class="rounded-pill px-4" :prepend-icon="showComments ? 'mdi-comment-off-outline' : 'mdi-comment-multiple-outline'" @click="toggleCommentsView">
{{ showComments ? '댓글 숨기기' : '댓글 보기' }}
</v-btn>
</div>
</div>
​<div v-if="showComments" class="comments-section pa-4 border-bottom-glass position-relative">
<div class="d-flex align-center justify-space-between flex-wrap gap-2 mb-3 pb-2 border-bottom-glass">
<span class="text-subtitle-1 font-weight-bold text-white">
댓글 {{ totalCommentCount > 0 ? totalCommentCount.toLocaleString() + '개' : '' }}
</span>
​<div class="d-flex align-center gap-3">
<v-checkbox
v-model="showReplies"
color="accent"
label="대댓글 표시"
density="compact"
hide-details
class="text-caption ma-0 pa-0 text-white"
></v-checkbox>
​<v-menu location="bottom left">
<template v-slot:activator="{ props }">
<v-btn v-bind="props" variant="text" size="small" class="text-none text-white font-weight-bold px-2 rounded-pill" prepend-icon="mdi-sort-variant">정렬 기준</v-btn>
</template>
<v-list density="compact" class="glass-modal rounded-xl py-1">
<v-list-item value="relevance" :class="{ 'text-accent': commentsOrder === 'relevance' }" @click="changeCommentsOrder('relevance')">
<v-list-item-title class="font-weight-bold text-body-2 text-white">인기 댓글순</v-list-item-title>
</v-list-item>
<v-list-item value="time" :class="{ 'text-accent': commentsOrder === 'time' }" @click="changeCommentsOrder('time')">
<v-list-item-title class="font-weight-bold text-body-2 text-white">최신순</v-list-item-title>
</v-list-item>
</v-list>
</v-menu>
</div>
</div>
​<div ref="commentsScrollRef" class="comments-scroll-area" @scroll="checkCommentsScroll">
<div v-if="comments.length === 0 && !isLoadingComments" class="text-grey-darken-1 text-caption text-center py-4">표시할 댓글이 없습니다.</div>
​<template v-for="(comment, index) in topLevelComments" :key="comment.id || index">
<div class="comment-item mb-4 pb-3 border-bottom-glass">
<div class="d-flex align-start">
<v-avatar :size="34" class="mr-3 mt-1 flex-shrink-0">
<v-img :src="comment.authorProfileImageUrl || 'https://cdn.vuetifyjs.com/images/lists/1.jpg'"></v-img>
</v-avatar>
<div class="flex-grow-1 overflow-hidden">
<div class="d-flex align-center flex-wrap gap-1 mb-1">
<span class="text-caption font-weight-bold mr-1" :class="comment.isOwner ? 'creator-author-badge' : 'text-white'">{{ comment.author }}</span>
<v-chip v-if="comment.isOwner" size="x-small" color="accent" variant="flat" class="px-2 py-0 font-weight-bold text-caption rounded-pill" style="height: 18px;">채널 작성자</v-chip>
<span class="text-grey-darken-1 text-caption ml-1">{{ comment.publishedAt }}</span>
</div>
<p class="text-grey-lighten-2 text-caption mb-2 comment-text-content" v-html="comment.text"></p>
​<div class="d-flex align-center gap-2 text-caption text-grey-darken-1">
<div class="d-flex align-center">
<v-icon icon="mdi-thumb-up-outline" size="14" class="mr-1"></v-icon>
<span>{{ comment.likeCount > 0 ? comment.likeCount : '' }}</span>
</div>
​<v-btn
v-if="comment.replyCount > 0"
variant="text"
size="x-small"
color="accent"
class="text-none font-weight-bold px-1 ml-2"
prepend-icon="mdi-menu-down"
@click="fetchOrToggleReplies(comment)"
>
{{ activeExpandedCommentId === comment.id ? '답글 숨기기 ▲' : 답글 ${comment.replyCount}개 }}
</v-btn>
</div>
</div>
</div>
​<div v-if="showReplies || activeExpandedCommentId === comment.id" class="ml-8 mt-2 pl-3 border-left-glass">
<div v-if="isLoadingReplies && activeExpandedCommentId === comment.id" class="text-center py-2">
<v-progress-circular indeterminate color="accent" size="18" width="2"></v-progress-circular>
<span class="text-grey-lighten-1 text-caption ml-2">답글 불러오는 중...</span>
</div>
<div v-for="reply in getRepliesForComment(comment.id)" :key="reply.id" class="comment-item mb-2 pb-2">
<div class="d-flex align-start">
<v-avatar :size="26" class="mr-2 mt-1 flex-shrink-0">
<v-img :src="reply.authorProfileImageUrl || 'https://cdn.vuetifyjs.com/images/lists/1.jpg'"></v-img>
</v-avatar>
<div class="flex-grow-1 overflow-hidden">
<div class="d-flex align-center flex-wrap gap-1 mb-1">
<span class="text-caption font-weight-bold mr-1" :class="reply.isOwner ? 'creator-author-badge' : 'text-white'">{{ reply.author }}</span>
<v-chip v-if="reply.isOwner" size="x-small" color="accent" variant="flat" class="px-2 py-0 font-weight-bold text-caption rounded-pill" style="height: 18px;">채널 작성자</v-chip>
<span class="text-grey-darken-1 text-caption ml-1">{{ reply.publishedAt }}</span>
</div>
<p class="text-grey-lighten-2 text-caption mb-1 comment-text-content" v-html="reply.text"></p>
</div>
</div>
</div>
​<v-btn
v-if="!comment.repliesLoaded && comment.replyCount > (getRepliesForComment(comment.id).length)"
variant="text"
size="x-small"
color="accent"
class="text-none font-weight-bold px-1 mt-1"
@click="fetchRepliesForComment(comment)"
>
답글 더보기
</v-btn>
</div>
</div>
</template>
​<div v-if="isLoadingComments" class="text-center py-2">
<v-progress-circular indeterminate color="accent" size="20" width="2"></v-progress-circular>
<span class="text-grey-lighten-1 text-caption ml-2">댓글 더 불러오는 중...</span>
</div>
</div>
</div>
​<div class="related-videos-section pa-4 position-relative">
<div class="text-subtitle-2 font-weight-bold text-white mb-3 d-flex align-center">
<v-icon icon="mdi-playlist-play" class="mr-2 text-accent" size="22"></v-icon>
관련 영상 (비슷한 채널 및 추천)
</div>
<div v-if="relatedVideos.length === 0" class="text-grey-darken-1 text-caption text-center py-6">관련 영상이 없습니다.</div>
<div ref="relatedScrollRef" class="related-scroll-area-long" @scroll="checkRelatedScroll">
<div v-for="video in relatedVideos" :key="video.id" class="related-video-item d-flex align-center mb-2.5 pa-2.5 rounded-xl cursor-pointer" @click="playVideo(video)">
<v-img :src="video.thumbnail" width="130" height="74" cover class="rounded-xl mr-3 flex-shrink-0 bg-black"></v-img>
<div class="overflow-hidden flex-grow-1">
<h4 class="text-white text-caption text-md-body-2 font-weight-bold text-truncate-2 mb-1" v-html="video.title"></h4>
<p class="text-grey-darken-1 text-caption mb-0">
<span class="text-white creator-name-link font-weight-medium" @click.stop="selectCreatorFromVideo(video)" title="이 채널로 이동">{{ video.creatorName }}</span>
<span class="text-accent font-weight-medium">({{ getCreatorSubCount(video.creatorId, video) }})</span>
<span v-if="video.views > 0" class="text-grey-darken-1 ml-1">• {{ formatViewCount(video.views) }}</span>
</p>
</div>
</div>
</div>
</div>
</div>
</v-card>
</v-dialog>
​<!-- 브라우저 기본 alert/confirm 대체 자체 메시지 팝업 -->
<v-dialog v-model="appMessage.visible" max-width="420" persistent>
<v-card class="glass-modal rounded-2xl pa-5 text-white app-message-card">
<div class="d-flex align-center mb-3">
<v-icon
:icon="appMessage.type === 'confirm' ? 'mdi-help-circle-outline' : 'mdi-information-outline'"
:color="appMessage.type === 'confirm' ? 'amber-lighten-2' : 'deep-purple-accent-2'"
size="28"
class="mr-2"
/>
<h3 class="text-subtitle-1 font-weight-bold">{{ appMessage.title }}</h3>
</div>
<p class="text-body-2 text-grey-lighten-2 app-message-text">{{ appMessage.message }}</p>
<div class="d-flex justify-end gap-2 mt-5">
<v-btn
v-if="appMessage.type === 'confirm'"
variant="text"
color="grey-lighten-1"
@click="resolveAppConfirm(false)"
>취소</v-btn>
<v-btn
color="deep-purple-darken-2"
variant="flat"
class="text-white font-weight-bold rounded-pill px-5"
@click="appMessage.type === 'confirm' ? resolveAppConfirm(true) : closeAppAlert()"
>{{ appMessage.type === 'confirm' ? '확인' : '닫기' }}</v-btn>
</div>
</v-card>
</v-dialog>
</v-app>
</template>
​<script setup>
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue'
​const drawer = ref(false)
const searchQuery = ref('')
const activeFilterQuery = ref('')
const selectedCreator = ref(null)
const currentTab = ref('discoverHeart')
const isSearchMode = ref(false)
const isTrendingMode = ref(false)
const isFavoriteVideosMode = ref(false)
const favoriteVideosContinueEnabled = ref(true)
const isHistoryMode = ref(false)
const isPlaylistMode = ref(false)
const isMusicMode = ref(false)
const isAlgorithmMode = ref(false)
​const isLoading = ref(false)
​// 앱 내부 메시지 팝업
const appMessage = reactive({
visible: false,
type: 'alert',
title: '알림',
message: '',
})
let appConfirmResolver = null
​const showAppAlert = (message, title = '알림') => {
appMessage.type = 'alert'
appMessage.title = title
appMessage.message = String(message ?? '')
appMessage.visible = true
}
​const closeAppAlert = () => {
appMessage.visible = false
}
​const resolveAppConfirm = (result) => {
appMessage.visible = false
const resolve = appConfirmResolver
appConfirmResolver = null
if (resolve) resolve(Boolean(result))
}
​// 로컬 무한 스크롤 표시 개수 상태
const visibleLimit = ref(40)
​const creatorFileInput = ref(null)
const playlistFileInput = ref(null)
const singlePlaylistFileInput = ref(null)
const musicFileInput = ref(null)
​const creators = ref([])
const videos = ref([])
const musicVideos = ref([])
const algorithmVideos = ref([])
const algorithmNextPageToken = ref(null)
​const musicCategory = ref('top')
const musicCategories = [
{ title: '인기 가요/팝', value: 'top' },
{ title: '발라드 믹스', value: 'ballad' },
{ title: '아이돌/댄스', value: 'dance' },
{ title: 'Lo-Fi / 힙합', value: 'lofi' },
{ title: '재즈 / 어쿠스틱', value: 'jazz' }
]
​const playlistGroups = ref([
{ id: 'g_default', name: '기본', order: 0 },
{ id: 'g_music', name: '음악', order: 1 }
])
const activeGroupId = ref('g_default')
const isGroupDialogVisible = ref(false)
const groupFormName = ref('')
​const playlists = ref([])
const activePlaylistId = ref(null)
​const playlistResumeStates = reactive({})
​const savePlaylistResumeState = (playlistId) => {
const val = playlistResumeStates[playlistId] ?? true
localStorage.setItem(neontube_playlist_resume_${playlistId}, val)
}
​const hasPlaylistResumeMemory = (playlistId) => {
return localStorage.getItem(neontube_playlist_last_index_${playlistId}) !== null
}
​const clearPlaylistResumeMemory = (playlistId) => {
localStorage.removeItem(neontube_playlist_last_index_${playlistId})
showAppAlert('해당 재생 목록의 이어보기 위치가 초기화되었습니다.')
}
​const isPlaylistDialogVisible = ref(false)
const playlistFormName = ref('')
const playlistFormGroupId = ref('g_default')
const editingPlaylist = ref(null)
​const isSaveToPlaylistDialogVisible = ref(false)
const targetPlaylistIds = ref([])
const quickNewPlaylistName = ref('')
​const selectedVideoIds = ref([])
const playlistQueue = ref([])
const playlistIndex = ref(0)
const isQueueModalOpen = ref(false)
​const channelNextPageTokens = ref(new Map())
const trendingNextPageToken = ref(null)
​const isPlayerOpen = ref(false)
const isPlayerCompactMode = ref(false)
const isFloatingPlayerMode = ref(false)
​const getVisibleViewport = () => {
if (typeof window === 'undefined') return { width: 1024, height: 768 }
const vv = window.visualViewport
return {
width: Math.round(vv?.width || window.innerWidth),
height: Math.round(vv?.height || window.innerHeight),
}
}
const initialPlayerViewport = getVisibleViewport()
const viewportWidth = ref(initialPlayerViewport.width)
const viewportHeight = ref(initialPlayerViewport.height)
const floatingPlayerWidth = ref(Math.min(420, Math.max(240, viewportWidth.value - 24)))
const floatingPlayerX = ref(12)
const floatingPlayerY = ref(84)
​const floatingMinWidth = computed(() => Math.min(220, floatingMaxWidth.value))
const floatingMaxWidth = computed(() => Math.max(180, Math.min(760, viewportWidth.value - 16)))
​const floatingPlayerStyle = computed(() => ({
position: 'fixed',
left: ${floatingPlayerX.value}px,
top: ${floatingPlayerY.value}px,
width: ${floatingPlayerWidth.value}px,
maxWidth: 'calc(100vw - 16px)',
margin: '0',
zIndex: 2200,
}))
​let playerPointerMode = null
let playerPointerStartX = 0
let playerPointerStartY = 0
let playerPointerOriginX = 0
let playerPointerOriginY = 0
let playerPointerStartWidth = 0
​const clampFloatingPlayerPosition = () => {
const width = Math.min(floatingPlayerWidth.value, Math.max(180, viewportWidth.value - 16))
floatingPlayerWidth.value = width
const estimatedHeight = width * 9 / 16 + 52
floatingPlayerX.value = Math.max(8, Math.min(floatingPlayerX.value, viewportWidth.value - width - 8))
floatingPlayerY.value = Math.max(8, Math.min(floatingPlayerY.value, viewportHeight.value - Math.min(estimatedHeight, viewportHeight.value - 16) - 8))
}
​const setFloatingPlayerWidth = (value) => {
const numericValue = Number(value)
if (!Number.isFinite(numericValue)) return
floatingPlayerWidth.value = Math.max(floatingMinWidth.value, Math.min(floatingMaxWidth.value, numericValue))
clampFloatingPlayerPosition()
}
​const toggleFloatingPlayerMode = () => {
isFloatingPlayerMode.value = !isFloatingPlayerMode.value
if (isFloatingPlayerMode.value) {
const visibleViewport = getVisibleViewport()
viewportWidth.value = visibleViewport.width
viewportHeight.value = visibleViewport.height
floatingPlayerWidth.value = Math.min(floatingPlayerWidth.value, floatingMaxWidth.value)
floatingPlayerX.value = viewportWidth.value - floatingPlayerWidth.value - 12
floatingPlayerY.value = Math.max(8, viewportHeight.value - (floatingPlayerWidth.value * 9 / 16) - 96)
clampFloatingPlayerPosition()
}
}
​const togglePlayerCompactMode = () => {
isPlayerCompactMode.value = !isPlayerCompactMode.value
if (!isPlayerCompactMode.value) isFloatingPlayerMode.value = false
}
​const onPlayerPointerMove = (event) => {
if (!playerPointerMode) return
event.preventDefault()
const deltaX = event.clientX - playerPointerStartX
const deltaY = event.clientY - playerPointerStartY
if (playerPointerMode === 'drag') {
floatingPlayerX.value = playerPointerOriginX + deltaX
floatingPlayerY.value = playerPointerOriginY + deltaY
clampFloatingPlayerPosition()
} else if (playerPointerMode === 'resize') {
setFloatingPlayerWidth(playerPointerStartWidth + deltaX)
}
}
​const stopPlayerPointerInteraction = () => {
playerPointerMode = null
window.removeEventListener('pointermove', onPlayerPointerMove)
window.removeEventListener('pointerup', stopPlayerPointerInteraction)
window.removeEventListener('pointercancel', stopPlayerPointerInteraction)
}
​const startPlayerDrag = (event) => {
if (!isPlayerCompactMode.value || !isFloatingPlayerMode.value || event.button !== 0) return
event.preventDefault()
playerPointerMode = 'drag'
playerPointerStartX = event.clientX
playerPointerStartY = event.clientY
playerPointerOriginX = floatingPlayerX.value
playerPointerOriginY = floatingPlayerY.value
window.addEventListener('pointermove', onPlayerPointerMove, { passive: false })
window.addEventListener('pointerup', stopPlayerPointerInteraction)
window.addEventListener('pointercancel', stopPlayerPointerInteraction)
}
​const startPlayerResize = (event) => {
if (!isPlayerCompactMode.value || !isFloatingPlayerMode.value || event.button !== 0) return
event.preventDefault()
playerPointerMode = 'resize'
playerPointerStartX = event.clientX
playerPointerStartY = event.clientY
playerPointerStartWidth = floatingPlayerWidth.value
window.addEventListener('pointermove', onPlayerPointerMove, { passive: false })
window.addEventListener('pointerup', stopPlayerPointerInteraction)
window.addEventListener('pointercancel', stopPlayerPointerInteraction)
}
​const activeVideo = ref(null)
const showComments = ref(false)
const showReplies = ref(true)
const activeExpandedCommentId = ref(null)
const isLoadingReplies = ref(false)
​const comments = ref([])
const commentsNextPageToken = ref(null)
const isLoadingComments = ref(false)
​const totalCommentCount = ref(0)
const commentsOrder = ref('relevance')
​const savedResumeSetting = localStorage.getItem('neontube_enable_resume')
const enableResume = ref(savedResumeSetting !== null ? savedResumeSetting === 'true' : true)
​const saveResumeSetting = () => {
localStorage.setItem('neontube_enable_resume', enableResume.value)
}
​const isAudioOnlyMode = ref(false)
const isLoopMode = ref(false)
​const toggleLoopMode = () => {
isLoopMode.value = !isLoopMode.value
}
​const sleepTimerSecondsLeft = ref(0)
const customSleepMinutes = ref(null)
let sleepTimerInterval = null
​const ytPlayer = ref(null)
​const searchNextPageToken = ref(null)
​const jumpMinutes = ref(0)
const jumpSeconds = ref(0)
const currentApiKeyNumber = ref(1)
​const mainScrollRef = ref(null)
const modalScrollRef = ref(null)
const commentsScrollRef = ref(null)
const relatedScrollRef = ref(null)
const showMainScrollTop = ref(false)
const showModalScrollTop = ref(false)
​let scrollTimeout = null
let searchPullStartY = null
let searchPullWasAtBottom = false
​const shouldUsePullToLoad = () => (
isSearchMode.value || isTrendingMode.value || isAlgorithmMode.value ||
Boolean(selectedCreator.value) || currentTab.value === 'discoverAll' || currentTab.value === 'discoverHeart'
)
​// Kiwi 앱의 최상단 스크롤 시 새로고침 방지 로직 개선
const onMainTouchStart = (e) => {
if (!shouldUsePullToLoad() || !e.touches?.length) {
searchPullStartY = null
searchPullWasAtBottom = false
return
}
const container = e.currentTarget
// 최상단에서 내리는 경우 브라우저 pull-to-refresh 간섭 방지
searchPullWasAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 35
searchPullStartY = e.touches[0].clientY
}
​const onMainTouchEnd = async (e) => {
if (!shouldUsePullToLoad() || searchPullStartY === null || !searchPullWasAtBottom) {
searchPullStartY = null
searchPullWasAtBottom = false
return
}
const endY = e.changedTouches?.[0]?.clientY
const pulledUp = typeof endY === 'number' && searchPullStartY - endY >= 65
searchPullStartY = null
searchPullWasAtBottom = false
if (!pulledUp || isLoading.value) return
​if (visibleLimit.value < allFilteredVideos.value.length) {
visibleLimit.value += 40
}
}
​const checkMainScroll = (e) => {
if (scrollTimeout) return
scrollTimeout = setTimeout(() => {
const target = e?.target || document.querySelector('.main-content')
const scrollTop = target ? target.scrollTop : (window.scrollY || document.documentElement.scrollTop || 0)
showMainScrollTop.value = scrollTop > 100
scrollTimeout = null
}, 100)
}
​const checkModalScroll = (e) => {
showModalScrollTop.value = e.target.scrollTop > 30
}
​const checkCommentsScroll = (e) => {
const target = e.target
if (!isLoadingComments.value && commentsNextPageToken.value) {
const bottomReached = target.scrollTop + target.clientHeight >= target.scrollHeight - 40
if (bottomReached) {
// 추가 댓글 로드 함수 호출
}
}
}
​const checkRelatedScroll = () => {}
​const scrollToTop = (el) => {
let targetElement = null
if (el && el.$el) {
targetElement = el.$el
} else if (el instanceof HTMLElement) {
targetElement = el
}
​if (!targetElement) {
targetElement = document.querySelector('.main-content') || document.querySelector('main')
}
​if (targetElement) {
if (typeof targetElement.scrollTo === 'function') {
targetElement.scrollTo({ top: 0, behavior: 'smooth' })
}
targetElement.scrollTop = 0
}
}
​const toggleAudioOnlyMode = () => {
isAudioOnlyMode.value = !isAudioOnlyMode.value
}
​const setSleepTimer = (minutes) => {
clearSleepTimer()
sleepTimerSecondsLeft.value = minutes * 60
sleepTimerInterval = setInterval(() => {
if (sleepTimerSecondsLeft.value > 0) {
sleepTimerSecondsLeft.value--
} else {
clearSleepTimer()
if (ytPlayer.value && typeof ytPlayer.value.pauseVideo === 'function') {
try { ytPlayer.value.pauseVideo() } catch (e) { console.debug(e) }
}
}
}, 1000)
}
​const setCustomSleepTimer = () => {
const mins = Number(customSleepMinutes.value)
if (!mins || mins <= 0) {
showAppAlert('올바른 분(Minute)을 입력해 주세요.')
return
}
setSleepTimer(mins)
customSleepMinutes.value = null
}
​const cancelSleepTimer = () => { clearSleepTimer() }
​const clearSleepTimer = () => {
if (sleepTimerInterval) {
clearInterval(sleepTimerInterval)
sleepTimerInterval = null
}
sleepTimerSecondsLeft.value = 0
}
​const formatSleepTime = (seconds) => {
const m = Math.floor(seconds / 60)
const s = seconds % 60
return m > 0 ? ${m}분 ${s}초 : ${s}초
}
​const formatVideoDuration = (totalSeconds) => {
const numericSeconds = Math.floor(Number(totalSeconds) || 0)
if (numericSeconds <= 0) return ''
const hours = Math.floor(numericSeconds / 3600)
const minutes = Math.floor((numericSeconds % 3600) / 60)
const seconds = numericSeconds % 60
​const pad = (n) => String(n).padStart(2, '0')
if (hours > 0) {
return ${hours}:${pad(minutes)}:${pad(seconds)}
}
return ${minutes}:${pad(seconds)}
}
​const formatViewCount = (viewCount) => {
const count = Number(viewCount) || 0
if (count >= 100000000) {
return ${(count / 100000000).toFixed(1)}억회
}
if (count >= 10000) {
return ${(count / 10000).toFixed(1)}만명
}
if (count >= 1000) {
return ${(count / 1000).toFixed(1)}천회
}
return ${count}회
}
​const formatCreatorSubCount = (subCount) => {
if (!subCount) return '구독중'
const str = String(subCount).trim()
if (str === '구독중' || str === '구독자 숨김') return str
if (str.includes('명') || str.includes('구독자')) return str
return ${str} 구독자
}
​const DB_NAME = 'NeonTubeDB_Clean'
const DB_VERSION = 5
​const openDB = () => {
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
if (!db.objectStoreNames.contains('playlists')) db.createObjectStore('playlists', { keyPath: 'id' })
if (!db.objectStoreNames.contains('playlistItems')) db.createObjectStore('playlistItems', { keyPath: 'id', autoIncrement: true })
if (!db.objectStoreNames.contains('playlistGroups')) db.createObjectStore('playlistGroups', { keyPath: 'id' })
}
})
}
​const getTodayString = () => new Date().toISOString().split('T')[0]
​// IndexedDB 트랜잭션 수명 주기 내에서 처리를 완료하도록 보장한 고친 함수
const saveNextApiKeyIndex = async (nextIndex) => {
const db = await openDB()
const today = getTodayString()
currentApiKeyNumber.value = nextIndex + 1
​return new Promise((resolve, reject) => {
const tx = db.transaction('meta', 'readwrite')
const store = tx.objectStore('meta')
const req = store.put({ id: 'api_key_state', date: today, currentIndex: nextIndex })
​req.onsuccess = () => resolve(true)
req.onerror = () => reject(req.error)
})
}
​// 계산된 바인딩 속성들
const allFilteredVideos = computed(() => videos.value)
const displayedVideos = computed(() => videos.value.slice(0, visibleLimit.value))
const shortsVideos = computed(() => displayedVideos.value.filter(v => v.isShorts))
const normalVideos = computed(() => displayedVideos.value.filter(v => !v.isShorts))
​const filteredPlaylists = computed(() => {
return playlists.value.filter(p => (p.groupId || 'g_default') === activeGroupId.value)
})
​const topLevelComments = computed(() => comments.value.filter(c => !c.parentId))
​const getRepliesForComment = (commentId) => {
return comments.value.filter(c => c.parentId === commentId)
}
​const getCurrentGroupName = () => {
const g = playlistGroups.value.find(x => x.id === activeGroupId.value)
return g ? g.name : '기본'
}
​const getHeaderTitle = computed(() => {
if (selectedCreator.value) return ${selectedCreator.value.name} 피드
if (isAlgorithmMode.value) return '알고리즘 추천 영상'
if (isMusicMode.value) return '음악 탭'
if (isTrendingMode.value) return '실시간 급상승 영상'
if (isSearchMode.value) return '유튜브 검색 결과'
if (isHistoryMode.value) return '시청 기록'
if (isFavoriteVideosMode.value) return '즐겨찾기 영상'
if (isPlaylistMode.value) return activePlaylistId.value ? '재생 목록 상세' : '재생 목록'
return currentTab.value === 'discoverHeart' ? '구독 피드 모음 (하트)' : '구독 크리에이터 전체 피드'
})
​const isAllSelected = computed({
get: () => displayedVideos.value.length > 0 && selectedVideoIds.value.length === displayedVideos.value.length,
set: (val) => {
if (val) {
selectedVideoIds.value = displayedVideos.value.map(v => v.id)
} else {
selectedVideoIds.value = []
}
}
})
​const isIndeterminate = computed(() => {
return selectedVideoIds.value.length > 0 && selectedVideoIds.value.length < displayedVideos.value.length
})
​// 더미 메서드 선언 (기능 연결용)
const handleUploadCreators = () => {}
const handleUploadPlaylists = () => {}
const handleUploadSinglePlaylist = () => {}
const handleUploadMusic = () => {}
const handleSearch = () => {}
const playSelectedVideos = () => {}
const openSaveToPlaylistDialog = () => {}
const clearSelectedVideos = () => {}
const triggerTabSearchOrUpdate = () => {}
const selectDiscoverAll = () => { currentTab.value = 'discoverAll'; selectedCreator.value = null; isSearchMode.value = false; isTrendingMode.value = false; isHistoryMode.value = false; isPlaylistMode.value = false; isMusicMode.value = false; isAlgorithmMode.value = false; }
const selectDiscoverHeart = () => { currentTab.value = 'discoverHeart'; selectedCreator.value = null; isSearchMode.value = false; isTrendingMode.value = false; isHistoryMode.value = false; isPlaylistMode.value = false; isMusicMode.value = false; isAlgorithmMode.value = false; }
const enableAlgorithmMode = () => { isAlgorithmMode.value = true; isSearchMode.value = false; isTrendingMode.value = false; isHistoryMode.value = false; isPlaylistMode.value = false; isMusicMode.value = false; selectedCreator.value = null; }
const enableFavoriteVideosMode = () => { isFavoriteVideosMode.value = true; isAlgorithmMode.value = false; isSearchMode.value = false; isTrendingMode.value = false; isHistoryMode.value = false; isPlaylistMode.value = false; isMusicMode.value = false; selectedCreator.value = null; }
const enablePlaylistMode = () => { isPlaylistMode.value = true; isFavoriteVideosMode.value = false; isAlgorithmMode.value = false; isSearchMode.value = false; isTrendingMode.value = false; isHistoryMode.value = false; isMusicMode.value = false; selectedCreator.value = null; }
const enableHistoryMode = () => { isHistoryMode.value = true; isPlaylistMode.value = false; isFavoriteVideosMode.value = false; isAlgorithmMode.value = false; isSearchMode.value = false; isTrendingMode.value = false; isMusicMode.value = false; selectedCreator.value = null; }
const enableSearchMode = () => { isSearchMode.value = true; isHistoryMode.value = false; isPlaylistMode.value = false; isFavoriteVideosMode.value = false; isAlgorithmMode.value = false; isTrendingMode.value = false; isMusicMode.value = false; selectedCreator.value = null; }
const enableTrendingMode = () => { isTrendingMode.value = true; isSearchMode.value = false; isHistoryMode.value = false; isPlaylistMode.value = false; isFavoriteVideosMode.value = false; isAlgorithmMode.value = false; isMusicMode.value = false; selectedCreator.value = null; }
const enableMusicMode = () => { isMusicMode.value = true; isTrendingMode.value = false; isSearchMode.value = false; isHistoryMode.value = false; isPlaylistMode.value = false; isFavoriteVideosMode.value = false; isAlgorithmMode.value = false; selectedCreator.value = null; }
const downloadCreatorsBackup = () => {}
const triggerUploadCreators = () => {}
const selectCreatorFilter = (c) => { selectedCreator.value = c }
const toggleCreatorFavorite = () => {}
const unsubscribeCreator = () => {}
const toggleSelectAll = () => {}
const fetchAlgorithmVideos = () => {}
const selectMusicCategory = (cat) => { musicCategory.value = cat }
const downloadMusicBackup = () => {}
const triggerUploadMusic = () => {}
const playSelectedOrAllMusic = () => {}
const playVideo = (v) => { activeVideo.value = v; isPlayerOpen.value = true; }
const selectCreatorFromVideo = () => {}
const getCreatorSubCount = () => '구독자'
const toggleVideoFavorite = () => {}
const openCreateGroupDialog = () => { isGroupDialogVisible.value = true }
const createPlaylistGroup = () => { isGroupDialogVisible.value = false }
const deletePlaylistGroup = () => {}
const downloadPlaylistsBackup = () => {}
const triggerUploadPlaylists = () => {}
const openCreatePlaylistDialog = () => { editingPlaylist.value = null; isPlaylistDialogVisible.value = true; }
const movePlaylistToGroup = () => {}
const downloadSinglePlaylistBackup = () => {}
const triggerUploadSinglePlaylist = () => {}
const openEditPlaylistDialog = (pl) => { editingPlaylist.value = pl; isPlaylistDialogVisible.value = true; }
const deletePlaylist = () => {}
const getPlaylistVideoCount = () => 0
const playPlaylistFolder = () => {}
const selectPlaylistFolder = (pl) => { activePlaylistId.value = pl.id }
const savePlaylistFolder = () => { isPlaylistDialogVisible.value = false }
const onDragStart = () => {}
const onDrop = () => {}
const movePlaylistItemOrder = () => {}
const removeVideoFromActivePlaylist = () => {}
const formatRelativeTime = () => '방금 전'
const deleteHistoryRecord = () => {}
const toggleSubscribeFromCard = () => {}
const quickCreateAndSelectPlaylist = () => {}
const confirmSaveToPlaylists = () => { isSaveToPlaylistDialogVisible.value = false }
const shufflePlaylistQueue = () => {}
const playQueueIndex = (idx) => { playlistIndex.value = idx }
const onDialogModelUpdate = () => {}
const closePlayer = () => { isPlayerOpen.value = false }
const playPreviousInQueue = () => {}
const playNextInQueue = () => {}
const toggleSubscribeFromPlayer = () => {}
const jumpToTime = () => {}
const cumulativeJump = () => {}
const handleTimePaste = () => {}
const toggleCommentsView = () => { showComments.value = !showComments.value }
const changeCommentsOrder = (order) => { commentsOrder.value = order }
const fetchOrToggleReplies = (c) => { activeExpandedCommentId.value = c.id }
const fetchRepliesForComment = () => {}
​onMounted(() => {
window.addEventListener('resize', stopPlayerPointerInteraction)
})
​onUnmounted(() => {
window.removeEventListener('resize', stopPlayerPointerInteraction)
})
</script>
​<style scoped>
/* Kiwi 앱 및 모바일 브라우저 pull-to-refresh 제스처 방지 스타일 */
.prevent-pull-to-refresh {
overscroll-behavior-y: contain;
touch-action: pan-y;
}
​.glass-card {
background: rgba(255, 255, 255, 0.05);
backdrop-filter: blur(10px);
border: 1px solid rgba(255, 255, 255, 0.1);
}
​.glass-modal {
background: rgba(20, 20, 30, 0.85);
backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.15);
}
​.neon-active {
border-left: 3px solid #b388ff;
background: rgba(179, 136, 255, 0.15);
}
​.shorts-horizontal-scroll {
display: flex;
gap: 12px;
overflow-x: auto;
padding-bottom: 8px;
}
​.shorts-card {
width: 140px;
}
​.cursor-pointer {
cursor: pointer;
}
​.youtube-iframe {
width: 100%;
height: 100%;
min-height: 240px;
}
</style>