<template>
  <v-app class="neon-youtube-app">
    <!-- 배경 네온 블러 효과 요소 -->
    <div class="bg-blob blob-1"></div>
    <div class="bg-blob blob-2"></div>

    <!-- 숨겨진 파일 업로드 인풋들 -->
    <input ref="creatorFileInput" type="file" accept="application/json,.json" style="display: none;" @change="handleUploadCreators" />
    <input ref="playlistFileInput" type="file" accept="application/json,.json" style="display: none;" @change="handleUploadPlaylists" />
    <input ref="singlePlaylistFileInput" type="file" accept="application/json,.json" style="display: none;" @change="handleUploadSinglePlaylist" />
    <input ref="musicFileInput" type="file" accept="application/json,.json" style="display: none;" @change="handleUploadMusic" />

    <!-- 상단 앱바 -->
    <v-app-bar flat class="glass-app-bar px-2 px-md-6" height="68">
      <v-app-bar-nav-icon @click="drawer = !drawer" class="text-white" density="compact"></v-app-bar-nav-icon>
      
      <div class="d-flex align-center ml-1 mr-3 gap-1 flex-shrink-0">
        <v-icon icon="mdi-play-box-multiple" class="text-accent" size="28"></v-icon>
        <span class="text-accent text-caption font-weight-bold ml-1" title="현재 사용 중인 YouTube API 키 번호">#{{ currentApiKeyNumber }}</span>
      </div>
      
      <v-text-field
        v-model="searchQuery"
        density="compact"
        variant="outlined"
        :placeholder="selectedCreator ? `${selectedCreator.name} 내 검색어 입력 후 엔터...` : (isAlgorithmMode ? '알고리즘 추천 영상 내 검색어 입력 후 엔터...' : (isMusicMode ? '음악/아티스트 검색어 입력 후 엔터...' : (isTrendingMode ? '인기 급상승 영상 내 검색어 입력 후 엔터...' : (isSearchMode ? '유튜브 전체 검색어 입력 후 엔터...' : (isHistoryMode ? '시청 기록 내 검색어 입력 후 엔터...' : (isFavoriteVideosMode ? '즐겨찾기 영상 내 검색어 입력 후 엔터...' : (isPlaylistMode ? '재생 목록 내 검색어 입력 후 엔터...' : '구독 피드 내 검색어 입력 후 엔터 또는 돋보기 버튼 클릭...')))))))"
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
              :title="`선택한 ${selectedVideoIds.length}개 영상 연속 재생`"
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

            <v-btn
              v-if="selectedVideoIds.length > 0"
              icon="mdi-folder-plus"
              size="small"
              variant="flat"
              color="deep-purple-accent-2"
              title="선택한 영상을 재생 목록에 저장"
              @click.stop="openSaveToPlaylistDialog(null)"
            ></v-btn>

            <v-btn
              v-if="selectedVideoIds.length > 0"
              icon="mdi-close-circle"
              size="small"
              variant="text"
              color="red-lighten-2"
              title="선택한 영상 내역 초기화"
              @click.stop="clearSelectedVideos"
            ></v-btn>

            <v-btn
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

      <template v-slot:extension>
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

    <!-- 네비게이션 사이드바 -->
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

        <v-list-item 
          prepend-icon="mdi-heart-outline" 
          title="구독 피드 모음 (하트 인플루언서)" 
          value="discoverHeart" 
          class="mb-2 custom-list-item"
          :class="{ 'neon-active': currentTab === 'discoverHeart' && !selectedCreator }"
          @click="selectDiscoverHeart"
        ></v-list-item>

        <v-list-item 
          prepend-icon="mdi-brain" 
          title="알고리즘 추천 피드" 
          value="algorithmMode" 
          class="mb-2 custom-list-item"
          :class="{ 'neon-active': isAlgorithmMode }"
          @click="enableAlgorithmMode"
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
          prepend-icon="mdi-playlist-music" 
          title="재생 목록" 
          value="playlistMode" 
          class="mb-2 custom-list-item"
          :class="{ 'neon-active': isPlaylistMode }"
          @click="enablePlaylistMode"
        ></v-list-item>

        <v-list-item 
          prepend-icon="mdi-history" 
          title="시청 기록" 
          value="historyMode" 
          class="mb-2 custom-list-item"
          :class="{ 'neon-active': isHistoryMode }"
          @click="enableHistoryMode"
        ></v-list-item>
        
        <v-list-item 
          prepend-icon="mdi-magnify" 
          title="유튜브 전체 검색" 
          value="searchMode" 
          class="mb-2 custom-list-item"
          :class="{ 'neon-active': isSearchMode }"
          @click="enableSearchMode"
        ></v-list-item>

        <v-list-item 
          prepend-icon="mdi-fire" 
          title="실시간 급상승 영상" 
          value="trendingMode" 
          class="mb-2 custom-list-item"
          :class="{ 'neon-active': isTrendingMode }"
          @click="enableTrendingMode"
        ></v-list-item>

        <v-list-item 
          prepend-icon="mdi-music-box-outline" 
          title="음악 탭" 
          value="musicMode" 
          class="mb-2 custom-list-item"
          :class="{ 'neon-active': isMusicMode }"
          @click="enableMusicMode"
        ></v-list-item>
        
        <v-divider class="border-opacity-25 my-4"></v-divider>
        
        <div class="px-3 d-flex align-center justify-space-between mb-2">
          <span class="text-subtitle-2 text-grey-lighten-1 font-weight-bold">구독 크리에이터</span>
          <div class="d-flex align-center gap-1">
            <v-btn icon="mdi-download" size="x-small" variant="text" color="accent" title="구독 목록 백업 (내려받기)" @click="downloadCreatorsBackup"></v-btn>
            <v-btn icon="mdi-upload" size="x-small" variant="text" color="accent" title="구독 목록 불러오기 (올리기)" @click="triggerUploadCreators"></v-btn>
          </div>
        </div>
        
        <div v-if="creators.length === 0" class="px-3 py-4 text-grey-darken-1 text-caption text-center">
          검색 후 채널을 구독하거나<br/>영상을 추가해 보세요.
        </div>

        <v-list-item
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

    <!-- 메인 콘텐츠 영역 -->
    <v-main ref="mainScrollRef" class="main-content position-relative" :class="{ 'player-dock-active': isPlayerOpen && isPlayerCompactMode && !isFloatingPlayerMode }" @scroll="checkMainScroll" @touchstart="onMainTouchStart" @touchend="onMainTouchEnd" @touchcancel="onMainTouchCancel">
      <v-container fluid class="pa-3 pa-md-8 max-container-width main-content-container">
        
        <!-- 타이틀 영역 -->
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

        <!-- 음악 탭 UI -->
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

          <div class="d-flex justify-space-between align-center mb-4 flex-wrap gap-2">
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

          <v-row v-if="isLoading && displayedVideos.length === 0" justify="center" align="center" style="min-height: 250px;">
            <v-col cols="12" class="text-center">
              <v-progress-circular indeterminate color="accent" size="48" class="mb-3"></v-progress-circular>
              <h3 class="text-subtitle-1 text-grey-lighten-1 font-weight-bold">음악을 불러오는 중입니다...</h3>
            </v-col>
          </v-row>

          <v-row v-else-if="displayedVideos.length === 0" justify="center" align="center" style="min-height: 250px;">
            <v-col cols="12" class="text-center">
              <v-icon icon="mdi-music-note-off" size="56" class="text-grey-darken-2 mb-2"></v-icon>
              <h3 class="text-subtitle-1 text-grey-lighten-1 font-weight-bold">표시할 음악이 없습니다</h3>
              <p class="text-caption text-grey-darken-1 mt-1">상단 검색창에 가수나 곡명을 입력하고 엔터를 쳐서 검색해 보세요.</p>
            </v-col>
          </v-row>

          <div v-else class="d-flex flex-column gap-3">
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

                <div class="playlist-thumb-wrapper position-relative bg-black rounded-xl overflow-hidden flex-shrink-0">
                  <v-img :src="video.thumbnail" width="110" height="62" cover>
                    <div v-if="video.duration > 0" class="video-duration-badge-small">{{ formatVideoDuration(video.duration) }}</div>
                  </v-img>
                </div>

                <div class="overflow-hidden flex-grow-1">
                  <h3 class="text-white font-weight-bold text-body-2 text-md-subtitle-1 text-truncate mb-1" v-html="video.title"></h3>
                  <p class="text-grey-lighten-1 text-caption mb-0 text-truncate">
                    <span class="text-white creator-name-link font-weight-medium" @click.stop="selectCreatorFromVideo(video)" title="이 채널로 이동">{{ video.creatorName }}</span> 
                    <span class="text-accent font-weight-medium">({{ getCreatorSubCount(video.creatorId, video) }})</span>
                    <span v-if="video.views > 0" class="text-grey-darken-1 ml-1">• {{ formatViewCount(video.views) }}</span>
                  </p>
                </div>
              </div>

              <div class="d-flex align-center gap-1 flex-shrink-0" @click.stop>
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

        <!-- 재생 목록 폴더 및 카테고리 그룹 뷰 -->
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

            <!-- 오른쪽 재생 목록 폴더 목록 -->
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

              <v-row v-if="filteredPlaylists.length === 0" justify="center" align="center" style="min-height: 200px;">
                <v-col cols="12" class="text-center">
                  <v-icon icon="mdi-folder-outline" size="56" class="text-grey-darken-2 mb-2"></v-icon>
                  <h3 class="text-subtitle-1 text-grey-lighten-1 font-weight-bold">이 그룹에 생성된 재생 목록 폴더가 없습니다</h3>
                  <p class="text-caption text-grey-darken-1 mt-1">상단의 '현재 그룹에 새 폴더 만들기' 버튼을 눌러 만들어 보세요.</p>
                </v-col>
              </v-row>

              <v-row v-else>
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

                          <v-btn icon="mdi-download" size="x-small" variant="text" color="accent" title="이 폴더 개별 백업" @click="downloadSinglePlaylistBackup(playlist)"></v-btn>
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
                    
                    <div class="mt-3" @click.stop>
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

                    <div class="d-flex justify-space-between align-center mt-4" @click.stop>
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

                      <v-btn
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

        <!-- 재생 목록 폴더 내부 뷰 -->
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

            <div class="d-flex align-center gap-3">
              <v-checkbox
                v-model="playlistResumeStates[activePlaylistId]"
                color="accent"
                label="이어보기 사용"
                density="compact"
                hide-details
                class="text-caption ma-0 pa-0 text-white"
                @change="savePlaylistResumeState(activePlaylistId)"
              ></v-checkbox>

              <v-btn
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

          <v-row v-if="displayedVideos.length === 0" justify="center" align="center" style="min-height: 250px;">
            <v-col cols="12" class="text-center">
              <v-icon icon="mdi-play-box-outline" size="56" class="text-grey-darken-2 mb-2"></v-icon>
              <h3 class="text-subtitle-1 text-grey-lighten-1 font-weight-bold">이 재생 목록에 담긴 영상이 없습니다</h3>
            </v-col>
          </v-row>

          <div v-else class="d-flex flex-column gap-3">
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
                
                <v-checkbox
                  v-model="selectedVideoIds"
                  :value="video.id"
                  color="accent"
                  hide-details
                  density="compact"
                  class="ma-0 pa-0 flex-shrink-0"
                  @click.stop
                ></v-checkbox>

                <div class="playlist-thumb-wrapper position-relative bg-black rounded-xl overflow-hidden flex-shrink-0">
                  <v-img :src="video.thumbnail" width="110" height="62" cover>
                    <div v-if="video.duration > 0" class="video-duration-badge-small">{{ formatVideoDuration(video.duration) }}</div>
                  </v-img>
                </div>

                <div class="overflow-hidden flex-grow-1">
                  <h3 class="text-white font-weight-bold text-body-2 text-md-subtitle-1 text-truncate mb-1" v-html="video.title"></h3>
                  <p class="text-grey-lighten-1 text-caption mb-0 text-truncate">
                    <span class="text-white creator-name-link font-weight-medium" @click.stop="selectCreatorFromVideo(video)" title="이 채널로 이동">{{ video.creatorName }}</span> 
                    <span class="text-accent font-weight-medium">({{ getCreatorSubCount(video.creatorId, video) }})</span>
                    <span v-if="video.views > 0" class="text-grey-darken-1 ml-1">• {{ formatViewCount(video.views) }}</span>
                  </p>
                </div>
              </div>

              <div class="d-flex align-center gap-1 flex-shrink-0" @click.stop>
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

        <!-- 일반 영상 목록 뷰 -->
        <template v-else>
          <v-row v-if="isLoading && displayedVideos.length === 0" justify="center" align="center" style="min-height: 250px;">
            <v-col cols="12" class="text-center">
              <v-progress-circular indeterminate color="accent" size="48" class="mb-3"></v-progress-circular>
              <h3 class="text-subtitle-1 text-grey-lighten-1 font-weight-bold">영상을 불러오는 중입니다...</h3>
            </v-col>
          </v-row>

          <v-row v-else-if="displayedVideos.length === 0" justify="center" align="center" style="min-height: 250px;">
            <v-col cols="12" class="text-center">
              <v-icon icon="mdi-play-box-outline" size="56" class="text-grey-darken-2 mb-2"></v-icon>
              <h3 class="text-subtitle-1 text-grey-lighten-1 font-weight-bold">표시할 콘텐츠가 없습니다</h3>
              <p class="text-caption text-grey-darken-1 mt-1">
                {{ isAlgorithmMode ? '구독 중인 채널이 없거나 시청 기록이 적습니다.' : (isSearchMode ? '검색된 결과가 없습니다. 상단 바에 검색어를 입력하고 엔터를 쳐보세요.' : (isHistoryMode ? '시청한 기록이 없습니다. 영상을 시청해 보세요.' : (isFavoriteVideosMode ? '즐겨찾기(좋아요)한 영상이 없습니다.' : (isTrendingMode ? '실시간 급상승 영상을 불러오지 못했습니다.' : (currentTab === 'discoverHeart' ? '구독 피드 모음에 등록된 하트 크리에이터가 없거나 저장된 영상이 없습니다. 돋보기/엔터 키로 최신 영상을 불러오세요.' : '구독 중인 채널의 저장된 영상이 없습니다. 돋보기/엔터 키로 최신 영상을 불러오세요.'))))) }}
              </p>
            </v-col>
          </v-row>

          <template v-else>
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

                <div class="d-flex align-center flex-shrink-0" @click.stop>
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

            <!-- 일반 그리드 뷰 -->
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

                    <div class="shorts-thumbnail-wrapper position-relative bg-black">
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
                            <v-checkbox
                              v-if="isFavoriteVideosMode"
                              :model-value="isFavoriteVideoResumeEnabled(video)"
                              color="accent"
                              label="이어보기"
                              density="compact"
                              hide-details
                              class="ma-0 pa-0 text-caption"
                              @click.stop
                              @update:model-value="toggleFavoriteVideoResume(video, $event)"
                            ></v-checkbox>
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

              <div v-if="normalVideos.length > 0">
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

                      <div class="video-thumbnail-wrapper position-relative bg-black">
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

                      <v-card-text class="flex-grow-1 d-flex flex-column justify-space-between pa-3 pa-md-4">
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
                              <v-checkbox
                                v-if="isFavoriteVideosMode"
                                :model-value="isFavoriteVideoResumeEnabled(video)"
                                color="accent"
                                label="이어보기"
                                density="compact"
                                hide-details
                                class="ma-0 pa-0 text-caption"
                                @click.stop
                                @update:model-value="toggleFavoriteVideoResume(video, $event)"
                              ></v-checkbox>
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

      </v-container>

      <v-slide-y-transition>
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

    <!-- 로딩 오버레이 -->
    <div v-if="isLoading" class="loading-overlay-container">
      <div class="loading-card glass-modal pa-6 rounded-2xl d-flex flex-column align-center shadow-lg">
        <v-progress-circular indeterminate color="accent" size="48" width="4" class="mb-3"></v-progress-circular>
        <h3 class="text-subtitle-1 text-white font-weight-bold mb-1">조회 중입니다...</h3>
        <p class="text-caption text-grey-lighten-1 mb-0">잠시만 기다려 주세요.</p>
      </div>
    </div>

    <!-- 재생 목록 그룹 생성 다이얼로그 -->
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

    <!-- 재생 목록 생성/수정 다이얼로그 -->
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

    <!-- 영상 -> 재생 목록에 저장 다이얼로그 -->
    <v-dialog v-model="isSaveToPlaylistDialogVisible" max-width="420px">
      <v-card class="glass-modal rounded-2xl pa-5 text-white">
        <h3 class="text-subtitle-1 font-weight-bold mb-3">재생 목록에 저장</h3>
        
        <div v-if="playlists.length === 0" class="text-grey-darken-1 text-caption mb-3">
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

        <v-divider class="border-opacity-25 my-3"></v-divider>

        <div class="mb-3">
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

        <div class="d-flex justify-end gap-2 mt-3">
          <v-btn variant="text" color="grey-lighten-1" size="small" @click="isSaveToPlaylistDialogVisible = false">취소</v-btn>
          <v-btn color="deep-purple-darken-2" variant="flat" size="small" class="text-white font-weight-bold rounded-pill px-4" @click="confirmSaveToPlaylists">확인</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- 현재 재생 리스트 보기 모달 -->
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

        <div style="max-height: 350px; overflow-y: auto;" class="d-flex flex-column gap-2">
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

    <!-- 시네마틱 영상 재생 모달 (eager 속성 유지) -->
    <v-dialog v-model="isPlayerOpen" max-width="880px" width="100%" :scrim="false" persistent class="safe-player-dialog" :class="{ 'app-player-fullscreen-active': isAppPlayerFullscreen, 'app-landscape-emulated': true }" eager @update:model-value="onDialogModelUpdate">
      <v-card class="glass-modal rounded-2xl overflow-hidden pa-0" :class="{ 'player-compact-mode': isPlayerCompactMode, 'player-floating-mode': isPlayerCompactMode && isFloatingPlayerMode, 'app-player-fullscreen-mode': isAppPlayerFullscreen }" :style="isPlayerCompactMode && isFloatingPlayerMode ? floatingPlayerStyle : null">
        <div v-if="!isAppPlayerFullscreen" class="d-flex justify-space-between align-center px-3 py-2 px-md-5 bg-glass-bar mobile-tight-header" :class="{ 'player-floating-header': isPlayerCompactMode && isFloatingPlayerMode }">
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

            <v-btn icon="mdi-shuffle" variant="text" size="small" color="accent" class="mr-1" title="재생 리스트 무작위 섞기" @click="shufflePlaylistQueue"></v-btn>
            <v-btn icon="mdi-playlist-music-outline" variant="text" size="small" color="white" class="mr-1" title="현재 재생 리스트 보기" @click="isQueueModalOpen = true"></v-btn>

            <v-btn v-if="playlistQueue.length > 1" icon="mdi-skip-previous" variant="text" size="small" color="white" :disabled="playlistIndex <= 0" @click="playPreviousInQueue"></v-btn>
            <v-btn v-if="playlistQueue.length > 1" icon="mdi-skip-next" variant="text" size="small" color="white" :disabled="playlistIndex >= playlistQueue.length - 1" @click="playNextInQueue" class="mr-2"></v-btn>

            <!-- 취침 예약 -->
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
                    {{ sleepTimerSecondsLeft > 0 ? `⏰ 남은 시간: ${formatSleepTime(sleepTimerSecondsLeft)}` : '취침 예약 설정' }}
                  </v-list-item-title>
                </v-list-item>
                <v-divider class="border-opacity-25 my-1"></v-divider>
                
                <v-list-item class="px-3 py-1">
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

                <v-divider class="border-opacity-25 my-1"></v-divider>
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

            <v-btn 
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

            <v-menu v-if="isPlayerCompactMode && isFloatingPlayerMode" location="bottom end" :close-on-content-click="false">
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

            <v-btn
              v-if="isPlayerCompactMode"
              :icon="isFloatingPlayerMode ? 'mdi-dock-top' : 'mdi-picture-in-picture-bottom-right-outline'"
              variant="text"
              size="small"
              color="white"
              class="mr-1"
              :title="isFloatingPlayerMode ? '상단 고정 모드로 돌아가기' : '자유 이동 플로팅 모드'"
              @click="toggleFloatingPlayerMode"
            ></v-btn>

            <v-btn
              :icon="isAppPlayerFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'"
              variant="text"
              size="small"
              color="white"
              class="mr-1"
              :title="isAppPlayerFullscreen ? '앱 전체화면 종료' : '앱 전체화면'"
              @click="toggleAppPlayerFullscreen"
            ></v-btn>

            <v-btn
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

        <!-- 자체 가로 전체화면에서는 제목과 기존 도구 모음을 숨기고 종료 버튼 하나만 표시 -->
        <v-btn
          v-if="isAppPlayerFullscreen"
          class="app-fullscreen-exit-button"
          icon="mdi-fullscreen-exit"
          size="large"
          color="white"
          variant="tonal"
          aria-label="가로 전체화면 종료"
          title="가로 전체화면 종료"
          @click="toggleAppPlayerFullscreen"
        ></v-btn>

        <div ref="modalScrollRef" class="modal-vertical-container position-relative" @scroll="checkModalScroll">
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

          <div v-if="isAudioOnlyMode" class="radio-placeholder-card pa-6 text-center d-flex flex-column align-center justify-center">
            <v-icon icon="mdi-radio-tower" size="56" color="accent" class="pulse-icon mb-3"></v-icon>
            <h3 class="text-subtitle-1 font-weight-bold text-white mb-1">📻 라디오 전용 오디오 모드 재생 중</h3>
            <p class="text-caption text-grey-lighten-1 mb-0">영상은 숨겨지고 오디오만 연속 재생 중입니다.</p>
          </div>

          <div class="pa-4 pa-md-5 bg-glass-bar d-flex justify-space-between align-center flex-wrap gap-3 border-bottom-glass">
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

              <div class="d-flex align-center gap-2 mt-2">
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
            
            <div class="d-flex align-center jump-box-container pa-2 px-3 rounded-xl">
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

            <div>
              <v-btn color="accent" variant="outlined" size="small" class="rounded-pill px-4" :prepend-icon="showComments ? 'mdi-comment-off-outline' : 'mdi-comment-multiple-outline'" @click="toggleCommentsView">
                {{ showComments ? '댓글 숨기기' : '댓글 보기' }}
              </v-btn>
            </div>
          </div>

          <div v-if="showComments" class="comments-section pa-4 border-bottom-glass position-relative">
            <div class="d-flex align-center justify-space-between flex-wrap gap-2 mb-3 pb-2 border-bottom-glass">
              <span class="text-subtitle-1 font-weight-bold text-white">
                댓글 {{ totalCommentCount > 0 ? totalCommentCount.toLocaleString() + '개' : '' }}
              </span>
              
              <div class="d-flex align-center gap-3">
                <v-checkbox
                  v-model="showReplies"
                  color="accent"
                  label="대댓글 표시"
                  density="compact"
                  hide-details
                  class="text-caption ma-0 pa-0 text-white"
                ></v-checkbox>

                <v-menu location="bottom left">
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
            
            <div ref="commentsScrollRef" class="comments-scroll-area" @scroll="checkCommentsScroll">
              <div v-if="comments.length === 0 && !isLoadingComments" class="text-grey-darken-1 text-caption text-center py-4">표시할 댓글이 없습니다.</div>
              
              <template v-for="(comment, index) in topLevelComments" :key="comment.id || index">
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
                      
                      <div class="d-flex align-center gap-2 text-caption text-grey-darken-1">
                        <div class="d-flex align-center">
                          <v-icon icon="mdi-thumb-up-outline" size="14" class="mr-1"></v-icon>
                          <span>{{ comment.likeCount > 0 ? comment.likeCount : '' }}</span>
                        </div>

                        <v-btn
                          v-if="comment.replyCount > 0"
                          variant="text"
                          size="x-small"
                          color="accent"
                          class="text-none font-weight-bold px-1 ml-2"
                          prepend-icon="mdi-menu-down"
                          @click="fetchOrToggleReplies(comment)"
                        >
                          {{ activeExpandedCommentId === comment.id ? '답글 숨기기 ▲' : `답글 ${comment.replyCount}개` }}
                        </v-btn>
                      </div>
                    </div>
                  </div>

                  <div v-if="showReplies || activeExpandedCommentId === comment.id" class="ml-8 mt-2 pl-3 border-left-glass">
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

                    <v-btn
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

              <div v-if="isLoadingComments" class="text-center py-2">
                <v-progress-circular indeterminate color="accent" size="20" width="2"></v-progress-circular>
                <span class="text-grey-lighten-1 text-caption ml-2">댓글 더 불러오는 중...</span>
              </div>
            </div>
          </div>

          <div class="related-videos-section pa-4 position-relative">
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
    <!-- 브라우저 기본 alert/confirm 대체 자체 메시지 팝업 -->
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

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, reactive } from 'vue'

const drawer = ref(false)
const searchQuery = ref('')
const activeFilterQuery = ref('') 
const lastSearchQuery = ref('') 
const selectedCreator = ref(null)
const currentTab = ref('discoverHeart')
const isSearchMode = ref(false)
const isTrendingMode = ref(false)
const isFavoriteVideosMode = ref(false)
// 좋아요 탭의 이어보기는 영상별로 독립 저장합니다.
const favoriteVideoResumeStates = reactive({})
const isFavoriteVideoResumeEnabled = (video) => {
  const saved = favoriteVideoResumeStates[video.id]
  return saved === undefined ? true : saved
}
const toggleFavoriteVideoResume = (video, value) => {
  favoriteVideoResumeStates[video.id] = value
  try {
    const key = 'neontube_favorite_video_resume_states'
    const saved = JSON.parse(localStorage.getItem(key) || '{}')
    saved[video.id] = value
    localStorage.setItem(key, JSON.stringify(saved))
  } catch (e) { console.debug('좋아요 영상 이어보기 설정 저장 실패:', e) }
}
const loadFavoriteVideoResumeStates = () => {
  try {
    Object.assign(favoriteVideoResumeStates, JSON.parse(localStorage.getItem('neontube_favorite_video_resume_states') || '{}'))
  } catch (e) { console.debug('좋아요 영상 이어보기 설정 불러오기 실패:', e) }
}
const isHistoryMode = ref(false)
const isPlaylistMode = ref(false)
const isMusicMode = ref(false)
const isAlgorithmMode = ref(false)

const isLoading = ref(false)

// 브라우저 기본 alert/confirm 대신 사용하는 앱 내부 메시지 팝업
const appMessage = reactive({
  visible: false,
  type: 'alert',
  title: '알림',
  message: '',
})
let appConfirmResolver = null

const showAppAlert = (message, title = '알림') => {
  appMessage.type = 'alert'
  appMessage.title = title
  appMessage.message = String(message ?? '')
  appMessage.visible = true
}

const closeAppAlert = () => {
  appMessage.visible = false
}

const showAppConfirm = (message, title = '확인') => {
  // 연속 호출 시 이전 확인창의 Promise가 방치되지 않도록 취소 처리
  if (appConfirmResolver) {
    appConfirmResolver(false)
    appConfirmResolver = null
  }
  appMessage.type = 'confirm'
  appMessage.title = title
  appMessage.message = String(message ?? '')
  appMessage.visible = true
  return new Promise(resolve => {
    appConfirmResolver = resolve
  })
}

const resolveAppConfirm = (result) => {
  appMessage.visible = false
  const resolve = appConfirmResolver
  appConfirmResolver = null
  if (resolve) resolve(Boolean(result))
}


// ⚡ 로컬 무한 스크롤(페이지네이션) 표시 개수 상태
const visibleLimit = ref(40)

const creatorFileInput = ref(null)
const playlistFileInput = ref(null)
const singlePlaylistFileInput = ref(null)
const musicFileInput = ref(null)
let targetUploadPlaylistObj = null

const creators = ref([])
const videos = ref([])
const trendingVideos = ref([])
const searchResultVideos = ref([])
const musicVideos = ref([])
const algorithmVideos = ref([])
const algorithmNextPageToken = ref(null)
const historyList = ref([])

const musicCategory = ref('top')
const musicCategories = [
  { title: '인기 가요/팝', value: 'top' },
  { title: '발라드 믹스', value: 'ballad' },
  { title: '아이돌/댄스', value: 'dance' },
  { title: 'Lo-Fi / 힙합', value: 'lofi' },
  { title: '재즈 / 어쿠스틱', value: 'jazz' }
]

const playlistGroups = ref([
  { id: 'g_default', name: '기본', order: 0 },
  { id: 'g_music', name: '음악', order: 1 }
])
const activeGroupId = ref('g_default')
const isGroupDialogVisible = ref(false)
const groupFormName = ref('')

const playlists = ref([])
const playlistItems = ref([])
const activePlaylistId = ref(null)

const playlistResumeStates = reactive({})

const loadPlaylistResumeStates = () => {
  playlists.value.forEach(pl => {
    const saved = localStorage.getItem(`neontube_playlist_resume_${pl.id}`)
    playlistResumeStates[pl.id] = saved !== null ? saved === 'true' : true
  })
}

const savePlaylistResumeState = (playlistId) => {
  const val = playlistResumeStates[playlistId] ?? true
  localStorage.setItem(`neontube_playlist_resume_${playlistId}`, val)
}

const hasPlaylistResumeMemory = (playlistId) => {
  return localStorage.getItem(`neontube_playlist_last_index_${playlistId}`) !== null
}

const clearPlaylistResumeMemory = (playlistId) => {
  localStorage.removeItem(`neontube_playlist_last_index_${playlistId}`)
  showAppAlert('해당 재생 목록의 이어보기 위치가 초기화되었습니다.')
}

const isPlaylistDialogVisible = ref(false)
const playlistFormName = ref('')
const playlistFormGroupId = ref('g_default')
const editingPlaylist = ref(null)

const isSaveToPlaylistDialogVisible = ref(false)
const targetPlaylistIds = ref([])
const quickNewPlaylistName = ref('')

const selectedVideoIds = ref([])
const playlistQueue = ref([])
const playlistIndex = ref(0)
const isQueueModalOpen = ref(false)

const channelNextPageTokens = ref(new Map())
const trendingNextPageToken = ref(null)

const isPlayerOpen = ref(false)
// 컴팩트 플레이어는 기본 상단 고정이며, 필요하면 자유 이동 플로팅 모드로 전환
const isPlayerCompactMode = ref(false)
const isFloatingPlayerMode = ref(false)
// 앱 자체 전체화면은 YouTube 네이티브 전체화면과 별도로 동작합니다.
const isAppPlayerFullscreen = ref(false)
let appFullscreenRestoreState = null
const getVisibleViewport = () => {
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
const floatingMinWidth = computed(() => Math.min(220, floatingMaxWidth.value))
const floatingMaxWidth = computed(() => Math.max(180, Math.min(760, viewportWidth.value - 16)))
const floatingPlayerStyle = computed(() => ({
  position: 'fixed',
  left: `${floatingPlayerX.value}px`,
  top: `${floatingPlayerY.value}px`,
  width: `${floatingPlayerWidth.value}px`,
  maxWidth: 'calc(100vw - 16px)',
  margin: '0',
  zIndex: 2200,
}))
let playerPointerMode = null
let playerPointerStartX = 0
let playerPointerStartY = 0
let playerPointerOriginX = 0
let playerPointerOriginY = 0
let playerPointerStartWidth = 0

const clampFloatingPlayerPosition = () => {
  const width = Math.min(floatingPlayerWidth.value, Math.max(180, viewportWidth.value - 16))
  floatingPlayerWidth.value = width
  const estimatedHeight = width * 9 / 16 + 52
  floatingPlayerX.value = Math.max(8, Math.min(floatingPlayerX.value, viewportWidth.value - width - 8))
  floatingPlayerY.value = Math.max(8, Math.min(floatingPlayerY.value, viewportHeight.value - Math.min(estimatedHeight, viewportHeight.value - 16) - 8))
}

const setFloatingPlayerWidth = (value) => {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return
  floatingPlayerWidth.value = Math.max(floatingMinWidth.value, Math.min(floatingMaxWidth.value, numericValue))
  clampFloatingPlayerPosition()
}

const toggleFloatingPlayerMode = () => {
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

const togglePlayerCompactMode = () => {
  isPlayerCompactMode.value = !isPlayerCompactMode.value
  if (!isPlayerCompactMode.value) isFloatingPlayerMode.value = false
}

const toggleAppPlayerFullscreen = () => {
  if (!isAppPlayerFullscreen.value) {
    appFullscreenRestoreState = {
      compact: isPlayerCompactMode.value,
      floating: isFloatingPlayerMode.value
    }
    // 앱 전체화면과 플로팅/컴팩트 레이아웃이 겹치지 않도록 상세 모드에서 표시합니다.
    isPlayerCompactMode.value = false
    isFloatingPlayerMode.value = false
    isAppPlayerFullscreen.value = true

    // Fullscreen API가 지원되는 브라우저에서는 브라우저 UI까지 숨기도록 요청합니다.
    // iOS Safari에서는 지원 여부/정책에 따라 거부될 수 있으며 CSS 전체화면은 계속 유지됩니다.
    try {
      const requestFullscreen = document.documentElement?.requestFullscreen
      if (typeof requestFullscreen === 'function') {
        const fullscreenResult = requestFullscreen.call(document.documentElement)
        if (fullscreenResult && typeof fullscreenResult.catch === 'function') {
          fullscreenResult.catch(() => {})
        }
      }
    } catch (error) {
      // CSS 기반 앱 전체화면으로 대체합니다.
    }

    // Android 등 지원 브라우저에서는 가로 방향 잠금을 시도합니다.
    // iOS Safari/Chrome 등 미지원 환경에서는 사용자가 기기를 회전하면 CSS가 화면에 맞춥니다.
    try {
      const orientationLock = screen.orientation?.lock
      if (typeof orientationLock === 'function') {
        const lockResult = orientationLock.call(screen.orientation, 'landscape')
        if (lockResult && typeof lockResult.catch === 'function') {
          lockResult.catch(() => {})
        }
      }
    } catch (error) {
      // 회전 잠금 미지원/거부는 전체화면 표시 자체에 영향을 주지 않습니다.
    }
  } else {
    isAppPlayerFullscreen.value = false
    try {
      if (document.fullscreenElement && typeof document.exitFullscreen === 'function') {
        const exitResult = document.exitFullscreen()
        if (exitResult && typeof exitResult.catch === 'function') {
          exitResult.catch(() => {})
        }
      }
    } catch (error) {
      // Browser fullscreen may already have been exited by the user.
    }
    try {
      screen.orientation?.unlock?.()
    } catch (error) {
      // Orientation unlock is best-effort only.
    }
    if (appFullscreenRestoreState) {
      isPlayerCompactMode.value = appFullscreenRestoreState.compact
      isFloatingPlayerMode.value = appFullscreenRestoreState.floating
    }
    appFullscreenRestoreState = null
  }
}

const startPlayerDrag = (event) => {
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

const startPlayerResize = (event) => {
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

const onPlayerPointerMove = (event) => {
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

const stopPlayerPointerInteraction = () => {
  playerPointerMode = null
  window.removeEventListener('pointermove', onPlayerPointerMove)
  window.removeEventListener('pointerup', stopPlayerPointerInteraction)
  window.removeEventListener('pointercancel', stopPlayerPointerInteraction)
}

const handlePlayerViewportResize = () => {
  // 브라우저 주소창/하단 툴바가 있는 모바일 브라우저는 innerHeight가
  // 실제 보이는 영역과 다를 수 있어 visualViewport를 우선 사용합니다.
  const visibleViewport = getVisibleViewport()
  viewportWidth.value = visibleViewport.width
  viewportHeight.value = visibleViewport.height
  floatingPlayerWidth.value = Math.min(floatingPlayerWidth.value, floatingMaxWidth.value)
  clampFloatingPlayerPosition()
}

const activeVideo = ref(null)
const showComments = ref(false)
const showReplies = ref(true)               
const activeExpandedCommentId = ref(null)   
const isLoadingReplies = ref(false)

const comments = ref([])
const commentsNextPageToken = ref(null)
const isLoadingComments = ref(false)

const totalCommentCount = ref(0)
const commentsOrder = ref('relevance')

const initialWatchedTime = ref(0)
const pendingResumeSeek = ref(null)
const savedResumeSetting = localStorage.getItem('neontube_enable_resume')
const enableResume = ref(savedResumeSetting !== null ? savedResumeSetting === 'true' : true)

const saveResumeSetting = () => {
  localStorage.setItem('neontube_enable_resume', enableResume.value)
}

const isAudioOnlyMode = ref(false) 
const isLoopMode = ref(false)

const toggleLoopMode = () => {
  isLoopMode.value = !isLoopMode.value
}

const sleepTimerSecondsLeft = ref(0)
const customSleepMinutes = ref(null)
let sleepTimerInterval = null

const ytPlayer = ref(null)        
let historyInterval = null   
let currentPlayingTime = 0   

const searchNextPageToken = ref(null)
const draggedIndex = ref(null)

// ⚡ 브라우저 뒤로가기 시 구독 피드로 이동 (히스토리 스택 제거 및 단순화)
const handlePopState = () => {
  if (isPlayerOpen.value) {
    closePlayer()
    return
  }
  selectDiscoverHeart()
}

const jumpMinutes = ref(0)
const jumpSeconds = ref(0)
const currentApiKeyNumber = ref(1)

const mainScrollRef = ref(null)
const modalScrollRef = ref(null)
const commentsScrollRef = ref(null)
const relatedScrollRef = ref(null)
const showMainScrollTop = ref(false)
const showModalScrollTop = ref(false)

let scrollTimeout = null
let searchPullStartY = null
let searchPullWasAtBottom = false
let pullToRefreshStartY = null
let pullToRefreshWasAtTop = false
let pullToRefreshBlocked = false

const shouldUsePullToLoad = () => (
  isSearchMode.value || isTrendingMode.value || isAlgorithmMode.value ||
  Boolean(selectedCreator.value) || currentTab.value === 'discoverAll' || currentTab.value === 'discoverHeart'
)

const onMainTouchStart = (e) => {
  const container = e.currentTarget
  if (!e.touches?.length || !container) {
    searchPullStartY = null
    searchPullWasAtBottom = false
    pullToRefreshStartY = null
    pullToRefreshWasAtTop = false
    return
  }

  const touchTarget = e.target
  pullToRefreshBlocked = Boolean(touchTarget?.closest?.(
    'input, textarea, select, button, a, [contenteditable="true"], .video-container, .player-floating-mode, .safe-player-dialog'
  ))
  pullToRefreshWasAtTop = container.scrollTop <= 4 && !pullToRefreshBlocked
  pullToRefreshStartY = e.touches[0].clientY

  // 기존 맨 아래 당겨서 추가 로딩하는 동작은 그대로 유지합니다.
  if (!shouldUsePullToLoad()) {
    searchPullStartY = null
    searchPullWasAtBottom = false
    return
  }
  searchPullWasAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 35
  searchPullStartY = e.touches[0].clientY
}

const resetPullGestureState = () => {
  searchPullStartY = null
  searchPullWasAtBottom = false
  pullToRefreshStartY = null
  pullToRefreshWasAtTop = false
  pullToRefreshBlocked = false
}

const onMainTouchCancel = () => {
  resetPullGestureState()
}

const onMainTouchEnd = async (e) => {
  const endY = e.changedTouches?.[0]?.clientY
  const refreshStartY = pullToRefreshStartY
  const refreshWasAtTop = pullToRefreshWasAtTop
  const refreshBlocked = pullToRefreshBlocked
  const loadStartY = searchPullStartY
  const loadWasAtBottom = searchPullWasAtBottom
  resetPullGestureState()

  // 목록 최상단에서 아래로 충분히 당긴 경우 페이지를 새로고침합니다.
  // 브라우저 기본 당겨서 새로고침과 중복되지 않도록 .main-content에서 제스처를 처리합니다.
  const pulledDown = typeof endY === 'number' && typeof refreshStartY === 'number' && endY - refreshStartY >= 75
  if (pulledDown && refreshWasAtTop && !refreshBlocked && !isLoading.value) {
    window.location.reload()
    return
  }

  // 기존 목록 맨 아래에서 위로 당겨 추가 영상을 불러오는 동작
  if (!shouldUsePullToLoad() || loadStartY === null || !loadWasAtBottom) return
  const pulledUp = typeof endY === 'number' && loadStartY - endY >= 65
  if (!pulledUp || isLoading.value) return

  // 이미 받아온 영상이 더 있으면 먼저 화면 목록을 확장합니다.
  if (visibleLimit.value < allFilteredVideos.value.length) {
    visibleLimit.value += 40
    return
  }

  if (isSearchMode.value && searchNextPageToken.value) {
    await loadMoreSearchVideos()
  } else if (isTrendingMode.value && trendingNextPageToken.value) {
    await loadMoreTrendingVideos()
  } else if (isAlgorithmMode.value && algorithmNextPageToken.value) {
    await loadMoreAlgorithmVideos()
  } else if (selectedCreator.value) {
    await loadMoreChannelVideos(selectedCreator.value)
  } else if (currentTab.value === 'discoverAll' || currentTab.value === 'discoverHeart') {
    const heartCreators = creators.value.filter(c => c.isFavorite)
    const targets = currentTab.value === 'discoverHeart'
      ? (heartCreators.length > 0 ? heartCreators : creators.value)
      : creators.value
    // 채널별 다음 페이지 토큰이 있는 채널만 순서대로 추가 조회합니다.
    for (const creator of targets) {
      if (channelNextPageTokens.value.has(creator.id) && !isLoading.value) {
        await loadMoreChannelVideos(creator)
      }
    }
    await loadDataFromDB()
  }
}

const checkMainScroll = (e) => {
  if (scrollTimeout) return
  scrollTimeout = setTimeout(() => {
    const target = e?.target || document.querySelector('.main-content')
    const scrollTop = target ? target.scrollTop : (window.scrollY || document.documentElement.scrollTop || 0)
    showMainScrollTop.value = scrollTop > 100
    scrollTimeout = null
  }, 100)
}

const checkModalScroll = (e) => {
  showModalScrollTop.value = e.target.scrollTop > 30
}

const checkCommentsScroll = (e) => {
  const target = e.target
  if (!isLoadingComments.value && commentsNextPageToken.value) {
    const bottomReached = target.scrollTop + target.clientHeight >= target.scrollHeight - 40
    if (bottomReached) {
      fetchMoreComments(activeVideo.value?.youtubeId)
    }
  }
}

const checkRelatedScroll = () => {}

const scrollToTop = (el) => {
  let targetElement = null
  if (el && el.$el) {
    targetElement = el.$el
  } else if (el instanceof HTMLElement) {
    targetElement = el
  }
  
  if (!targetElement) {
    targetElement = document.querySelector('.main-content') || document.querySelector('main')
  }

  if (targetElement) {
    if (typeof targetElement.scrollTo === 'function') {
      targetElement.scrollTo({ top: 0, behavior: 'smooth' })
    }
    targetElement.scrollTop = 0
  }

  try {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    if (document.documentElement) document.documentElement.scrollTop = 0
    if (document.body) document.body.scrollTop = 0
  } catch (e) {
    console.debug(e)
  }
}

// 라디오 모드에서는 YouTube IFrame API가 지원하는 최저 화질(tiny)을 반복 요청합니다.
// YouTube 측 자동 화질 정책에 따라 실제 적용 화질은 플레이어가 결정할 수 있습니다.
const applyRadioPlaybackQuality = () => {
  if (!isAudioOnlyMode.value || !ytPlayer.value) return
  try {
    if (typeof ytPlayer.value.setPlaybackQuality === 'function') {
      ytPlayer.value.setPlaybackQuality('tiny')
    }
    if (typeof ytPlayer.value.getAvailableQualityLevels === 'function' &&
        typeof ytPlayer.value.setPlaybackQuality === 'function') {
      const levels = ytPlayer.value.getAvailableQualityLevels()
      if (Array.isArray(levels) && levels.includes('tiny')) {
        ytPlayer.value.setPlaybackQuality('tiny')
      }
    }
  } catch (error) {
    console.debug('라디오 모드 최저 화질 설정 요청 실패:', error)
  }
}

const toggleAudioOnlyMode = () => {
  isAudioOnlyMode.value = !isAudioOnlyMode.value
  if (isAudioOnlyMode.value) applyRadioPlaybackQuality()
}

const setSleepTimer = (minutes) => {
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
      closePlayer()
    }
  }, 1000)
}

const setCustomSleepTimer = () => {
  const mins = Number(customSleepMinutes.value)
  if (!mins || mins <= 0) {
    showAppAlert('올바른 분(Minute)을 입력해 주세요.')
    return
  }
  setSleepTimer(mins)
  customSleepMinutes.value = null
}

const cancelSleepTimer = () => { clearSleepTimer() }

const clearSleepTimer = () => {
  if (sleepTimerInterval) {
    clearInterval(sleepTimerInterval)
    sleepTimerInterval = null
  }
  sleepTimerSecondsLeft.value = 0
}

const formatSleepTime = (seconds) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}분 ${s}초` : `${s}초`
}

const formatVideoDuration = (totalSeconds) => {
  const numericSeconds = Math.floor(Number(totalSeconds) || 0)
  if (numericSeconds <= 0) return ''
  const hours = Math.floor(numericSeconds / 3600)
  const minutes = Math.floor((numericSeconds % 3600) / 60)
  const seconds = numericSeconds % 60

  const pad = (n) => String(n).padStart(2, '0')
  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`
  }
  return `${minutes}:${pad(seconds)}`
}

const formatViewCount = (viewCount) => {
  const count = Number(viewCount) || 0
  if (count >= 100000000) {
    return `${(count / 100000000).toFixed(1)}억회`
  }
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}만명`
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}천회`
  }
  return `${count}회`
}

const formatCreatorSubCount = (subCount) => {
  if (!subCount) return '구독중'
  const str = String(subCount).trim()
  if (str === '구독중' || str === '구독자 숨김') return str
  if (str.includes('명') || str.includes('구독자')) return str
  return `${str} 구독자`
}

const checkThumbnailAspectRatio = (videoList) => {
  if (!Array.isArray(videoList)) return
  videoList.forEach(video => {
    if (!video.isShorts && video.thumbnail) {
      const img = new Image()
      img.onload = () => {
        if (img.naturalHeight > img.naturalWidth) {
          video.isShorts = true
        }
      }
      img.src = video.thumbnail
    }
  })
}

const DB_NAME = 'NeonTubeDB_Clean'
const DB_VERSION = 5

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
      if (!db.objectStoreNames.contains('playlists')) db.createObjectStore('playlists', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('playlistItems')) db.createObjectStore('playlistItems', { keyPath: 'id', autoIncrement: true })
      if (!db.objectStoreNames.contains('playlistGroups')) db.createObjectStore('playlistGroups', { keyPath: 'id' })
    }
  })
}

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

const getTodayString = () => new Date().toISOString().split('T')[0]

const getActiveApiKeyIndex = async () => {
  if (API_KEYS.length === 0) return 0
  const db = await openDB()
  const today = getTodayString()

  return new Promise((resolve) => {
    const tx = db.transaction('meta', 'readonly')
    const req = tx.objectStore('meta').get('api_key_state')
    req.onsuccess = (e) => {
      const state = e.target.result
      const idx = (!state || state.date !== today) ? 0 : (state.currentIndex ?? 0)
      currentApiKeyNumber.value = idx + 1
      resolve(idx)
    }
    req.onerror = () => resolve(0)
  })
}

const saveNextApiKeyIndex = async (nextIndex) => {
  const db = await openDB()
  const today = getTodayString()
  currentApiKeyNumber.value = nextIndex + 1

  return new Promise((resolve) => {
    const tx = db.transaction('meta', 'readwrite')
    tx.objectStore('meta').put({ id: 'api_key_state', date: today, currentIndex: nextIndex })
    tx.oncomplete = () => resolve(true)
    tx.onerror = () => resolve(false)
  })
}

const fetchWithKeyRotation = async (urlBuilder) => {
  if (API_KEYS.length === 0) throw new Error('No API Keys available')

  let currentIndex = await getActiveApiKeyIndex()
  let attempts = 0

  while (attempts < API_KEYS.length) {
    const apiKey = API_KEYS[currentIndex]
    if (!apiKey) {
      currentIndex = (currentIndex + 1) % API_KEYS.length
      attempts++
      continue
    }

    currentApiKeyNumber.value = currentIndex + 1
    const response = await fetch(urlBuilder(apiKey))
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
  throw new Error('모든 YouTube API 키의 일일 할당량이 소진되었습니다.')
}

const getCreatorSubCount = (creatorId, video) => {
  if (video && video.creatorSubCount) {
    return formatCreatorSubCount(video.creatorSubCount)
  }
  const foundCreator = creators.value.find(c => c.id === creatorId)
  if (foundCreator && foundCreator.subCount) {
    return formatCreatorSubCount(foundCreator.subCount)
  }
  return '구독중'
}

const selectCreatorFromVideo = async (video) => {
  if (!video || !video.creatorId) return
  let creator = creators.value.find(c => c.id === video.creatorId)
  if (!creator) {
    creator = {
      id: video.creatorId,
      name: video.creatorName,
      subCount: video.creatorSubCount || '',
      avatar: video.thumbnail || 'https://cdn.vuetifyjs.com/images/lists/1.jpg',
      isFavorite: false
    }
  }
  await selectCreatorFilter(creator)
}

const fetchSubscriberCountsForChannelIds = async (channelIds) => {
  const uniqueIds = [...new Set(channelIds.filter(Boolean))]
  if (uniqueIds.length === 0 || API_KEYS.length === 0) return new Map()
  
  const subCountMap = new Map()
  for (let i = 0; i < uniqueIds.length; i += 50) {
    const chunk = uniqueIds.slice(i, i + 50).join(',')
    try {
      const data = await fetchWithKeyRotation((key) => 
        `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${chunk}&key=${key}`
      )
      if (data.items) {
        data.items.forEach(ch => {
          const rawCount = ch.statistics?.hiddenSubscriberCount ? null : parseInt(ch.statistics?.subscriberCount || 0, 10)
          const formatted = rawCount === null 
            ? '구독자 숨김' 
            : rawCount >= 10000 
              ? (rawCount / 10000).toFixed(1) + '만명' 
              : rawCount >= 1000 
                ? (rawCount / 1000).toFixed(1) + '천명' 
                : rawCount + '명'
          subCountMap.set(ch.id, formatted)
        })
      }
    } catch (err) {
      console.error('채널 구독자 수 일괄 조회 실패:', err)
    }
  }
  return subCountMap
}

const parseISO8601Duration = (durationStr) => {
  if (!durationStr) return 0
  const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  return (parseInt(match[1] || 0, 10) * 3600) + (parseInt(match[2] || 0, 10) * 60) + parseInt(match[3] || 0, 10)
}

const fetchAndUpdateVideoDetails = async (videoList) => {
  if (!videoList || videoList.length === 0 || API_KEYS.length === 0) return videoList
  const targetVideos = videoList.filter(v => !v.duration || v.duration === 0 || !v.views || v.views === 0)
  if (targetVideos.length === 0) return videoList

  for (let i = 0; i < targetVideos.length; i += 50) {
    const chunk = targetVideos.slice(i, i + 50)
    const ids = chunk.map(v => v.youtubeId).join(',')
    try {
      const data = await fetchWithKeyRotation((key) => 
        `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${ids}&key=${key}`
      )
      if (data.items) {
        const detailMap = new Map()
        data.items.forEach(item => {
          detailMap.set(item.id, {
            duration: parseISO8601Duration(item.contentDetails?.duration),
            views: parseInt(item.statistics?.viewCount || 0, 10)
          })
        })
        
        videoList.forEach(v => {
          if (detailMap.has(v.youtubeId)) {
            const info = detailMap.get(v.youtubeId)
            v.duration = info.duration
            v.views = info.views
            
            if (info.duration > 0 && info.duration <= 120) {
              v.isShorts = true
            }
          }
        })
      }
    } catch (err) { console.error('영상 상세 정보 일괄 조회 실패:', err) }
  }
  return videoList
}

const fetchAndSaveMissingVideos = async (db, itemVideoIds) => {
  if (!itemVideoIds || itemVideoIds.length === 0 || API_KEYS.length === 0) return

  const existingVideosStore = await new Promise((resolve) => {
    db.transaction('videos', 'readonly').objectStore('videos').getAll().onsuccess = (ev) => resolve(ev.target.result || [])
  })
  const existingVideoIds = new Set(existingVideosStore.map(v => v.id))
  const missingIds = itemVideoIds.filter(id => !existingVideoIds.has(id))

  if (missingIds.length > 0) {
    const channelIdsSet = new Set()
    for (let i = 0; i < missingIds.length; i += 50) {
      const chunk = missingIds.slice(i, i + 50).join(',')
      try {
        const data = await fetchWithKeyRotation((key) => 
          `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${chunk}&key=${key}`
        )
        if (data.items) {
          data.items.forEach(item => {
            if (item.snippet?.channelId) channelIdsSet.add(item.snippet.channelId)
          })
        }
      } catch (err) {
        console.error('누락된 영상 정보 조회 실패:', err)
      }
    }

    const subCountMap = await fetchSubscriberCountsForChannelIds([...channelIdsSet])

    for (let i = 0; i < missingIds.length; i += 50) {
      const chunk = missingIds.slice(i, i + 50).join(',')
      try {
        const data = await fetchWithKeyRotation((key) => 
          `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${chunk}&key=${key}`
        )
        if (data.items) {
          const videoTx = db.transaction('videos', 'readwrite')
          const videoStore = videoTx.objectStore('videos')

          data.items.forEach(item => {
            const snippet = item.snippet
            const videoId = item.id
            const title = snippet.title.toLowerCase()
            const thumbUrl = snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url
            const dur = parseISO8601Duration(item.contentDetails?.duration)
            const viewsCount = parseInt(item.statistics?.viewCount || 0, 10)
            const isShorts = title.includes('#shorts') || title.includes('shorts') || title.includes('#쇼츠') || (dur > 0 && dur <= 120)
            const channelId = snippet.channelId
            const matchedCreator = creators.value.find(c => c.id === channelId)
            const subCount = matchedCreator ? matchedCreator.subCount : (subCountMap.get(channelId) || '')

            const parsed = {
              id: videoId,
              youtubeId: videoId,
              creatorId: channelId,
              creatorName: snippet.channelTitle,
              creatorSubCount: subCount,
              title: snippet.title,
              thumbnail: thumbUrl,
              isShorts: isShorts,
              isFavorite: false,
              views: viewsCount,
              publishedAt: snippet.publishedAt,
              duration: dur,
              progressPercent: 0,
              currentTime: 0,
              historyUpdatedAt: null
            }
            checkThumbnailAspectRatio([parsed])
            videoStore.put(parsed)
            if (!videos.value.some(v => v.id === parsed.id)) {
              videos.value.push(parsed)
            }
          })
        }
      } catch (err) {
        console.error('누락된 영상 저장 실패:', err)
      }
    }
  }
}

const downloadCreatorsBackup = () => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(creators.value, null, 2))
  const downloadAnchor = document.createElement('a')
  downloadAnchor.setAttribute("href", dataStr)
  downloadAnchor.setAttribute("download", `neontube_creators_backup_${getTodayString()}.json`)
  document.body.appendChild(downloadAnchor)
  downloadAnchor.click()
  downloadAnchor.remove()
}

const triggerUploadCreators = () => {
  if (creatorFileInput.value) creatorFileInput.value.click()
}

const handleUploadCreators = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  isLoading.value = true
  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const importedCreators = JSON.parse(e.target.result)
      if (!Array.isArray(importedCreators)) {
        showAppAlert('올바르지 않은 구독 백업 파일 형식입니다.')
        isLoading.value = false
        return
      }

      const db = await openDB()
      const tx = db.transaction(['creators'], 'readwrite')
      const store = tx.objectStore('creators')

      let addedCount = 0
      importedCreators.forEach(imported => {
        if (!creators.value.some(existing => existing.id === imported.id)) {
          store.put(imported)
          creators.value.push(imported)
          addedCount++
        }
      })

      tx.oncomplete = async () => {
        await loadDataFromDB()
        isLoading.value = false
        showAppAlert(`구독 불러오기 완료! 새로운 크리에이터 ${addedCount}명이 추가되었습니다.`)
        if (addedCount > 0) {
          await fetchChannelVideosParallel(creators.value.filter(c => importedCreators.some(ic => ic.id === c.id)))
        }
      }
    } catch (err) {
      console.error(err)
      isLoading.value = false
      showAppAlert('파일을 읽는 중 오류가 발생했습니다.')
    } finally {
      event.target.value = ''
    }
  }
  reader.readAsText(file)
}

const downloadPlaylistsBackup = () => {
  const backupData = {
    playlistGroups: playlistGroups.value,
    playlists: playlists.value,
    playlistItems: playlistItems.value
  }
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2))
  const downloadAnchor = document.createElement('a')
  downloadAnchor.setAttribute("href", dataStr)
  downloadAnchor.setAttribute("download", `neontube_playlists_all_backup_${getTodayString()}.json`)
  document.body.appendChild(downloadAnchor)
  downloadAnchor.click()
  downloadAnchor.remove()
}

const triggerUploadPlaylists = () => {
  if (playlistFileInput.value) playlistFileInput.value.click()
}

const handleUploadPlaylists = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  isLoading.value = true
  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const imported = JSON.parse(e.target.result)
      const db = await openDB()

      const allItemVideoIds = imported.playlistItems ? imported.playlistItems.map(i => i.videoId) : []
      await fetchAndSaveMissingVideos(db, allItemVideoIds)

      const tx = db.transaction(['playlistGroups', 'playlists', 'playlistItems'], 'readwrite')
      
      if (imported.playlistGroups && Array.isArray(imported.playlistGroups)) {
        const groupStore = tx.objectStore('playlistGroups')
        imported.playlistGroups.forEach(g => {
          if (!playlistGroups.value.some(pg => pg.id === g.id)) {
            groupStore.put(g)
          }
        })
      }

      let addedPlCount = 0
      if (imported.playlists && Array.isArray(imported.playlists)) {
        const plStore = tx.objectStore('playlists')
        imported.playlists.forEach(pl => {
          const isExist = playlists.value.some(p => p.id === pl.id || p.name === pl.name)
          if (!isExist) {
            plStore.put(pl)
            addedPlCount++
          }
        })
      }
      if (imported.playlistItems && Array.isArray(imported.playlistItems)) {
        const itemStore = tx.objectStore('playlistItems')
        imported.playlistItems.forEach(item => {
          if (!playlistItems.value.some(i => i.playlistId === item.playlistId && i.videoId === item.videoId)) {
            const { ...rest } = item
            itemStore.add(rest)
          }
        })
      }

      tx.oncomplete = async () => {
        await loadDataFromDB()
        isLoading.value = false
        showAppAlert(`전체 재생 목록 불러오기 완료! (${addedPlCount}개 새로운 폴더 추가됨)`)
      }
    } catch (err) {
      console.error(err)
      isLoading.value = false
      showAppAlert('재생 목록 파일을 읽는 중 오류가 발생했습니다.')
    } finally {
      event.target.value = ''
    }
  }
  reader.readAsText(file)
}

const downloadSinglePlaylistBackup = (playlist) => {
  const items = playlistItems.value.filter(i => i.playlistId === playlist.id)
  const backupData = {
    playlist,
    items
  }
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2))
  const downloadAnchor = document.createElement('a')
  downloadAnchor.setAttribute("href", dataStr)
  downloadAnchor.setAttribute("download", `neontube_playlist_${playlist.name.replace(/\s+/g, '_')}_backup.json`)
  document.body.appendChild(downloadAnchor)
  downloadAnchor.click()
  downloadAnchor.remove()
}

const triggerUploadSinglePlaylist = (playlist) => {
  targetUploadPlaylistObj = playlist || null
  if (singlePlaylistFileInput.value) singlePlaylistFileInput.value.click()
}

const handleUploadSinglePlaylist = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  isLoading.value = true
  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const imported = JSON.parse(e.target.result)
      
      if (!imported.playlist || !imported.playlist.name) {
        isLoading.value = false
        showAppAlert('올바르지 않은 개별 재생 목록 백업 파일 형식입니다.')
        return
      }

      const importedName = imported.playlist.name
      const db = await openDB()

      const importedItemVideoIds = imported.items ? imported.items.map(i => i.videoId) : []
      await fetchAndSaveMissingVideos(db, importedItemVideoIds)

      let targetFolder = targetUploadPlaylistObj
      if (!targetFolder) {
        targetFolder = playlists.value.find(p => p.name === importedName)
      }

      if (!targetFolder) {
        const newPlId = 'pl_' + Date.now()
        const newPl = { id: newPlId, name: importedName, groupId: activeGroupId.value, order: playlists.value.length }
        
        const tx = db.transaction(['playlists', 'playlistItems'], 'readwrite')
        tx.objectStore('playlists').put(newPl)

        if (imported.items && Array.isArray(imported.items)) {
          const itemStore = tx.objectStore('playlistItems')
          imported.items.forEach(item => {
            itemStore.add({ playlistId: newPlId, videoId: item.videoId })
          })
        }

        tx.oncomplete = async () => {
          await loadDataFromDB()
          isLoading.value = false
          showAppAlert(`새로운 재생 목록 폴더 "${importedName}"이(가) 자동 생성되고 영상들이 정상적으로 불러와졌습니다!`)
        }
      } else {
        const tx = db.transaction(['playlistItems'], 'readwrite')
        const itemStore = tx.objectStore('playlistItems')

        let addedCount = 0
        if (imported.items && Array.isArray(imported.items)) {
          imported.items.forEach(item => {
            if (!playlistItems.value.some(i => i.playlistId === targetFolder.id && i.videoId === item.videoId)) {
              itemStore.add({ playlistId: targetFolder.id, videoId: item.videoId })
              addedCount++
            }
          })
        }

        tx.oncomplete = async () => {
          await loadDataFromDB()
          isLoading.value = false
          showAppAlert(`"${targetFolder.name}" 폴더에 영상 ${addedCount}개가 성공적으로 추가되었습니다!`)
        }
      }
    } catch (err) {
      console.error(err)
      isLoading.value = false
      showAppAlert('파일을 읽는 중 오류가 발생했습니다.')
    } finally {
      event.target.value = ''
      targetUploadPlaylistObj = null
    }
  }
  reader.readAsText(file)
}

const downloadMusicBackup = () => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(musicVideos.value, null, 2))
  const downloadAnchor = document.createElement('a')
  downloadAnchor.setAttribute("href", dataStr)
  downloadAnchor.setAttribute("download", `neontube_music_backup_${getTodayString()}.json`)
  document.body.appendChild(downloadAnchor)
  downloadAnchor.click()
  downloadAnchor.remove()
}

const triggerUploadMusic = () => {
  if (musicFileInput.value) musicFileInput.value.click()
}

const handleUploadMusic = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  isLoading.value = true
  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const imported = JSON.parse(e.target.result)
      if (Array.isArray(imported)) {
        musicVideos.value = imported
        checkThumbnailAspectRatio(musicVideos.value)
        isLoading.value = false
        showAppAlert('음악 탭 데이터를 성공적으로 불러왔습니다.')
      } else {
        isLoading.value = false
      }
    } catch (err) {
      console.error(err)
      isLoading.value = false
      showAppAlert('음악 파일을 읽는 중 오류가 발생했습니다.')
    } finally {
      event.target.value = ''
    }
  }
  reader.readAsText(file)
}

// 카테고리 그룹 관리 함수들
const openCreateGroupDialog = () => {
  groupFormName.value = ''
  isGroupDialogVisible.value = true
}

const createPlaylistGroup = async () => {
  const name = groupFormName.value.trim()
  if (!name) { showAppAlert('그룹 이름을 입력해 주세요.'); return }

  const isDuplicate = playlistGroups.value.some(g => g.name === name)
  if (isDuplicate) {
    showAppAlert(`오류: 이미 동일한 이름("${name}")의 그룹이 존재합니다!`)
    return
  }

  const newGroupId = 'group_' + Date.now()
  const newGroup = { id: newGroupId, name, order: playlistGroups.value.length }

  const db = await openDB()
  const tx = db.transaction('playlistGroups', 'readwrite')
  tx.objectStore('playlistGroups').put(newGroup)

  tx.oncomplete = async () => {
    isGroupDialogVisible.value = false
    await loadDataFromDB()
    activeGroupId.value = newGroupId
  }
}

const deletePlaylistGroup = async (group) => {
  if (group.id === 'g_default' || group.id === 'g_music') {
    showAppAlert('기본 그룹 및 음악 그룹은 삭제할 수 없습니다.')
    return
  }
  if (!await showAppConfirm(`'${group.name}' 그룹을 삭제하시겠습니까? (소속된 재생 목록 폴더들은 '기본' 그룹으로 이동됩니다)`)) return

  const db = await openDB()
  const tx = db.transaction(['playlistGroups', 'playlists'], 'readwrite')
  tx.objectStore('playlistGroups').delete(group.id)

  const plStore = tx.objectStore('playlists')
  plStore.openCursor().onsuccess = (e) => {
    const cursor = e.target.result
    if (cursor) {
      const pl = cursor.value
      if (pl.groupId === group.id) {
        pl.groupId = 'g_default'
        cursor.update(pl)
      }
      cursor.continue()
    }
  }

  tx.oncomplete = async () => {
    activeGroupId.value = 'g_default'
    await loadDataFromDB()
  }
}

const movePlaylistToGroup = async (playlist, targetGroupId) => {
  if ((playlist.groupId || 'g_default') === targetGroupId) return
  playlist.groupId = targetGroupId
  
  const db = await openDB()
  const tx = db.transaction('playlists', 'readwrite')
  tx.objectStore('playlists').put(JSON.parse(JSON.stringify(playlist)))

  tx.oncomplete = async () => {
    await loadDataFromDB()
    const targetGroup = playlistGroups.value.find(g => g.id === targetGroupId)
    showAppAlert(`"${playlist.name}" 폴더가 "${targetGroup ? targetGroup.name : '선택한'}" 그룹으로 성공적으로 이동되었습니다.`)
  }
}

const getCurrentGroupName = () => {
  const g = playlistGroups.value.find(item => item.id === activeGroupId.value)
  return g ? g.name : '기본'
}

const filteredPlaylists = computed(() => {
  return playlists.value.filter(p => (p.groupId || 'g_default') === activeGroupId.value)
})

const openCreatePlaylistDialog = () => {
  editingPlaylist.value = null
  playlistFormName.value = ''
  playlistFormGroupId.value = activeGroupId.value
  isPlaylistDialogVisible.value = true
}

const openEditPlaylistDialog = (playlist) => {
  editingPlaylist.value = playlist
  playlistFormName.value = playlist.name
  playlistFormGroupId.value = playlist.groupId || activeGroupId.value
  isPlaylistDialogVisible.value = true
}

const savePlaylistFolder = async () => {
  const name = playlistFormName.value.trim()
  if (!name) { showAppAlert('폴더 이름을 입력해 주세요.'); return }

  const targetGroupId = playlistFormGroupId.value || activeGroupId.value
  const isDuplicateName = playlists.value.some(p => p.name === name && p.groupId === targetGroupId && p.id !== editingPlaylist.value?.id)
  if (isDuplicateName) {
    showAppAlert(`오류: 이미 동일한 이름("${name}")의 재생 목록 폴더가 해당 그룹에 존재합니다!`)
    return
  }

  const db = await openDB()
  const tx = db.transaction('playlists', 'readwrite')
  const store = tx.objectStore('playlists')

  if (editingPlaylist.value) {
    editingPlaylist.value.name = name
    editingPlaylist.value.groupId = targetGroupId
    store.put(JSON.parse(JSON.stringify(editingPlaylist.value)))
  } else {
    store.put({ 
      id: 'pl_' + Date.now(), 
      name: name, 
      groupId: targetGroupId, 
      order: playlists.value.length 
    })
  }

  tx.oncomplete = async () => {
    isPlaylistDialogVisible.value = false
    await loadDataFromDB()
  }
}

const quickCreateAndSelectPlaylist = async () => {
  const name = quickNewPlaylistName.value.trim()
  if (!name) { showAppAlert('새 폴더 이름을 입력해 주세요.'); return }

  const isDuplicateName = playlists.value.some(p => p.name === name && p.groupId === activeGroupId.value)
  if (isDuplicateName) {
    showAppAlert(`오류: 이미 동일한 이름("${name}")의 재생 목록 폴더가 존재합니다!`)
    return
  }

  const newId = 'pl_' + Date.now()
  const db = await openDB()
  const tx = db.transaction('playlists', 'readwrite')
  tx.objectStore('playlists').put({ id: newId, name: name, groupId: activeGroupId.value, order: playlists.value.length })

  tx.oncomplete = async () => {
    quickNewPlaylistName.value = ''
    await loadDataFromDB()
    if (!targetPlaylistIds.value.includes(newId)) targetPlaylistIds.value.push(newId)
  }
}

const deletePlaylist = async (playlist) => {
  if (!await showAppConfirm(`'${playlist.name}' 재생 목록을 삭제하시겠습니까?`)) return
  const db = await openDB()
  const tx = db.transaction(['playlists', 'playlistItems'], 'readwrite')
  tx.objectStore('playlists').delete(playlist.id)
  
  const itemStore = tx.objectStore('playlistItems')
  itemStore.openCursor().onsuccess = (e) => {
    const cursor = e.target.result
    if (cursor) {
      if (cursor.value.playlistId === playlist.id) cursor.delete()
      cursor.continue()
    }
  }

  tx.oncomplete = async () => {
    if (activePlaylistId.value === playlist.id) activePlaylistId.value = null
    localStorage.removeItem(`neontube_playlist_resume_${playlist.id}`)
    localStorage.removeItem(`neontube_playlist_last_index_${playlist.id}`)
    await loadDataFromDB()
  }
}

const movePlaylistItemOrder = async (index, direction) => {
  const targetIndex = index + direction
  const currentList = displayedVideos.value
  if (targetIndex < 0 || targetIndex >= currentList.length) return

  const temp = currentList[index]
  currentList[index] = currentList[targetIndex]
  currentList[targetIndex] = temp

  await saveActivePlaylistItemsOrder(currentList)
}

const onDragStart = (index) => {
  draggedIndex.value = index
}

const onDrop = async (targetIndex) => {
  if (draggedIndex.value === null || draggedIndex.value === targetIndex) return
  const currentList = [...displayedVideos.value]
  
  const movedItem = currentList.splice(draggedIndex.value, 1)[0]
  currentList.splice(targetIndex, 0, movedItem)

  draggedIndex.value = null
  await saveActivePlaylistItemsOrder(currentList)
}

const saveActivePlaylistItemsOrder = async (newList) => {
  const db = await openDB()
  const tx = db.transaction('playlistItems', 'readwrite')
  const store = tx.objectStore('playlistItems')

  const oldItems = playlistItems.value.filter(i => i.playlistId === activePlaylistId.value)
  oldItems.forEach(item => {
    if (item.id) store.delete(item.id)
  })

  newList.forEach(video => {
    store.add({ playlistId: activePlaylistId.value, videoId: video.id })
  })

  tx.oncomplete = async () => {
    await loadDataFromDB()
  }
}

const removeVideoFromActivePlaylist = async (video) => {
  const targetItem = playlistItems.value.find(i => i.playlistId === activePlaylistId.value && i.videoId === video.id)
  if (!targetItem) return

  const db = await openDB()
  const tx = db.transaction('playlistItems', 'readwrite')
  tx.objectStore('playlistItems').delete(targetItem.id)

  tx.oncomplete = async () => {
    await loadDataFromDB()
  }
}

const deleteHistoryRecord = async (video) => {
  const db = await openDB()
  const tx = db.transaction('history', 'readwrite')
  tx.objectStore('history').delete(video.id)

  tx.oncomplete = async () => {
    await loadDataFromDB()
  }
}

const getPlaylistVideoCount = (playlistId) => playlistItems.value.filter(item => item.playlistId === playlistId).length

const openSaveToPlaylistDialog = (video) => {
  if (video) selectedVideoIds.value = [video.id]
  if (selectedVideoIds.value.length === 0) return
  targetPlaylistIds.value = []
  quickNewPlaylistName.value = ''
  isSaveToPlaylistDialogVisible.value = true
}

const confirmSaveToPlaylists = async () => {
  if (targetPlaylistIds.value.length === 0 || selectedVideoIds.value.length === 0) {
    isSaveToPlaylistDialogVisible.value = false
    return
  }

  const db = await openDB()
  
  const allCurrentSelectableVideos = [
    ...videos.value,
    ...searchResultVideos.value,
    ...musicVideos.value,
    ...trendingVideos.value,
    ...algorithmVideos.value
  ]

  const videoTx = db.transaction('videos', 'readwrite')
  const videoStore = videoTx.objectStore('videos')

  selectedVideoIds.value.forEach(videoId => {
    const foundVideo = allCurrentSelectableVideos.find(v => v.id === videoId || v.youtubeId === videoId)
    if (foundVideo) {
      videoStore.put(JSON.parse(JSON.stringify(foundVideo)))
      if (!videos.value.some(v => v.id === foundVideo.id)) {
        videos.value.push(foundVideo)
      }
    }
  })

  const itemTx = db.transaction('playlistItems', 'readwrite')
  const itemStore = itemTx.objectStore('playlistItems')

  selectedVideoIds.value.forEach(videoId => {
    targetPlaylistIds.value.forEach(playlistId => {
      const alreadyExists = playlistItems.value.some(
        item => item.playlistId === playlistId && item.videoId === videoId
      )
      if (!alreadyExists) {
        itemStore.add({ playlistId, videoId })
      }
    })
  })

  itemTx.oncomplete = async () => {
    isSaveToPlaylistDialogVisible.value = false
    selectedVideoIds.value = []
    showAppAlert('선택한 영상이 재생 목록에 안전하게 저장되었습니다.')
    await loadDataFromDB()
  }
}

const selectPlaylistFolder = (playlist) => { activePlaylistId.value = playlist.id }

const playPlaylistFolder = async (playlist) => {
  const itemsInPlaylist = playlistItems.value.filter(i => i.playlistId === playlist.id)
  const targetVideos = []
  itemsInPlaylist.forEach(item => {
    const v = videos.value.find(video => video.id === item.videoId)
    if (v && !targetVideos.some(tv => tv.id === v.id)) targetVideos.push(v)
  })

  if (targetVideos.length === 0) return

  activePlaylistId.value = playlist.id
  const resumeEnabled = playlistResumeStates[playlist.id] ?? true
  enableResume.value = resumeEnabled

  playlistQueue.value = targetVideos

  let startIndex = 0
  if (resumeEnabled) {
    const savedIndexStr = localStorage.getItem(`neontube_playlist_last_index_${playlist.id}`)
    if (savedIndexStr !== null) {
      const parsedIdx = parseInt(savedIndexStr, 10)
      if (!isNaN(parsedIdx) && parsedIdx >= 0 && parsedIdx < targetVideos.length) {
        startIndex = parsedIdx
      }
    }
  }

  playlistIndex.value = startIndex
  await playQueueIndex(startIndex)
}

const playVideo = async (video) => {
  // 좋아요 탭은 각 영상 카드의 이어보기 체크 상태를 사용합니다.
  // 그 외 탭은 플레이어의 공통 이어보기 설정을 사용합니다.
  if (isFavoriteVideosMode.value) {
    enableResume.value = isFavoriteVideoResumeEnabled(video)
  } else if (!isPlaylistMode.value) {
    enableResume.value = true
  }

  playlistQueue.value = [video]
  playlistIndex.value = 0
  await playQueueIndex(0)
}

const playSelectedVideos = async () => {
  if (selectedVideoIds.value.length === 0) return
  const selectedList = displayedVideos.value.filter(v => selectedVideoIds.value.includes(v.id))
  if (selectedList.length === 0) return

  const orderedList = selectedVideoIds.value
    .map(id => selectedList.find(v => v.id === id))
    .filter(Boolean)

  if (!isPlaylistMode.value) {
    enableResume.value = true
  }
  playlistQueue.value = orderedList
  playlistIndex.value = 0
  selectedVideoIds.value = []
  await playQueueIndex(0)
}

const playSelectedOrAllMusic = async () => {
  const targetList = selectedVideoIds.value.length > 0 
    ? displayedVideos.value.filter(v => selectedVideoIds.value.includes(v.id))
    : displayedVideos.value
  
  if (targetList.length === 0) return
  enableResume.value = true
  playlistQueue.value = targetList
  playlistIndex.value = 0
  selectedVideoIds.value = []
  await playQueueIndex(0)
}

const clearSelectedVideos = () => { selectedVideoIds.value = [] }

const shufflePlaylistQueue = () => {
  if (playlistQueue.value.length <= 1) return
  const currentActive = playlistQueue.value[playlistIndex.value]
  const rest = playlistQueue.value.filter((_, idx) => idx !== playlistIndex.value)
  
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[rest[i], rest[j]] = [rest[j], rest[i]]
  }

  playlistQueue.value = [currentActive, ...rest]
  playlistIndex.value = 0
}

// ⚡ 근본적인 iOS 자동재생 해결: 미리 생성된 플레이어 인스턴스를 활용해 동기적 실행 보장
const playQueueIndex = async (idx) => {
  if (idx < 0 || idx >= playlistQueue.value.length) return
  playlistIndex.value = idx
  isQueueModalOpen.value = false

  if (activePlaylistId.value && (playlistResumeStates[activePlaylistId.value] ?? true)) {
    localStorage.setItem(`neontube_playlist_last_index_${activePlaylistId.value}`, idx)
  }

  const video = playlistQueue.value[idx]
  activeVideo.value = video
  showComments.value = true
  activeExpandedCommentId.value = null
  comments.value = []
  commentsNextPageToken.value = null
  totalCommentCount.value = 0
  commentsOrder.value = 'relevance'
  initialWatchedTime.value = 0
  pendingResumeSeek.value = null
  currentPlayingTime = 0
  jumpMinutes.value = 0
  jumpSeconds.value = 0

  if (!isPlayerOpen.value) {
    isPlayerCompactMode.value = false
    isFloatingPlayerMode.value = false
    window.history.pushState({ playerOpen: true }, '')
    window.addEventListener('popstate', handlePopState)
    isPlayerOpen.value = true
  }

  fetchComments(video.youtubeId)
  setupMediaSession(video)

  const startSec = 0 
  
  // 이미 사전 생성된 ytPlayer 인스턴스에 즉시 동기 명령 전달 (제스처 컨텍스트 유지)
  if (ytPlayer.value && typeof ytPlayer.value.loadVideoById === 'function') {
    try {
      ytPlayer.value.loadVideoById({ videoId: video.youtubeId, startSeconds: startSec, ...(isAudioOnlyMode.value ? { suggestedQuality: 'tiny' } : {}) })
      ytPlayer.value.playVideo()
      applyRadioPlaybackQuality()
      startHistoryTracker()
    } catch (e) {
      initYouTubePlayer(video.youtubeId, startSec)
    }
  } else {
    initYouTubePlayer(video.youtubeId, startSec)
  }

  // 비동기 이어보기 위치 조회
  try {
    const db = await openDB()
    const tx = db.transaction('history', 'readonly')
    const req = tx.objectStore('history').get(video.id)
    req.onsuccess = (e) => {
      const result = e.target.result
      // 비동기 조회가 끝났을 때 다른 영상으로 이미 이동했다면 오래된 위치를 적용하지 않습니다.
      if (!activeVideo.value || activeVideo.value.id !== video.id) return
      const watchedTime = result && result.currentTime ? Math.floor(result.currentTime) : 0
      const resumeTime = enableResume.value && watchedTime > 5 ? watchedTime : 0
      initialWatchedTime.value = resumeTime
      currentPlayingTime = resumeTime
      pendingResumeSeek.value = resumeTime > 0 ? { videoId: video.id, seconds: resumeTime } : null
      // 플레이어가 이미 해당 영상을 재생 중일 때만 즉시 이동합니다.
      if (resumeTime > 0 && ytPlayer.value && typeof ytPlayer.value.seekTo === 'function') {
        try {
          if (typeof ytPlayer.value.getPlayerState !== 'function' || ytPlayer.value.getPlayerState() === 1) {
            ytPlayer.value.seekTo(resumeTime, true)
            pendingResumeSeek.value = null
          }
        } catch (seekError) { console.debug('이어보기 위치 적용 대기:', seekError) }
      }
    }
  } catch (err) { console.error(err) }
}

const playNextInQueue = async () => {
  if (playlistIndex.value < playlistQueue.value.length - 1) {
    await playQueueIndex(playlistIndex.value + 1)
  }
}

const playPreviousInQueue = async () => {
  if (playlistIndex.value > 0) {
    await playQueueIndex(playlistIndex.value - 1)
  }
}

const toggleCommentsView = () => {
  showComments.value = !showComments.value
  if (showComments.value && comments.value.length === 0 && activeVideo.value) {
    fetchComments(activeVideo.value.youtubeId)
  }
}

const closePlayer = () => {
  stopHistoryTracker()
  
  // 플레이어를 파괴하지 않고 비디오만 정지하여 인스턴스 재사용성 유지
  if (ytPlayer.value && typeof ytPlayer.value.stopVideo === 'function') {
    try { 
      ytPlayer.value.stopVideo()
    } catch (e) { 
      console.debug(e) 
    }
  }
  
  isPlayerOpen.value = false
  isFloatingPlayerMode.value = false
  isAppPlayerFullscreen.value = false
  appFullscreenRestoreState = null
  try {
    if (document.fullscreenElement && typeof document.exitFullscreen === 'function') {
      const exitResult = document.exitFullscreen()
      if (exitResult && typeof exitResult.catch === 'function') {
        exitResult.catch((error) => {
          console.debug('전체화면 종료 처리:', error)
        })
      }
    }
  } catch (error) {
    console.debug('전체화면 종료 중 예외:', error)
  }
  try {
    screen.orientation?.unlock?.()
  } catch (error) {
    console.debug('화면 방향 잠금 해제 처리:', error)
  }
  stopPlayerPointerInteraction()
  saveCurrentHistoryToDB()

  window.removeEventListener('popstate', handlePopState)
  if ('mediaSession' in navigator) {
    navigator.mediaSession.playbackState = 'none'
  }
}

const onDialogModelUpdate = (val) => { if (!val) closePlayer() }

const setupMediaSession = (video) => {
  if (!('mediaSession' in navigator)) return
  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: video.title || 'NeonTube 재생',
      artist: video.creatorName || 'YouTube',
      album: 'NeonTube Player',
      artwork: [
        { src: video.thumbnail || '', sizes: '512x512', type: 'image/jpeg' }
      ]
    })

    navigator.mediaSession.playbackState = 'playing'

    navigator.mediaSession.setActionHandler('play', () => {
      if (ytPlayer.value && typeof ytPlayer.value.playVideo === 'function') ytPlayer.value.playVideo()
    })
    navigator.mediaSession.setActionHandler('pause', () => {
      if (ytPlayer.value && typeof ytPlayer.value.pauseVideo === 'function') ytPlayer.value.pauseVideo()
    })
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      if (playlistIndex.value > 0) playPreviousInQueue()
    })
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      if (playlistIndex.value < playlistQueue.value.length - 1) playNextInQueue()
    })
  } catch (e) {
    console.debug('MediaSession 설정 오류:', e)
  }
}

// ⚡ 앱 실행 시점에 플레이어를 미리 생성 (Pre-init)
const initPreloadedYouTubePlayer = () => {
  const createPlayerInstance = () => {
    const playerDiv = document.getElementById('youtube-player-div')
    if (!playerDiv || ytPlayer.value) return

    // 인라인 재생을 유지해 앱 자체 전체화면과 YouTube 기본 전체화면을 모두 선택할 수 있게 합니다.
    // YouTube 플레이어의 기본 전체화면 버튼은 fs=1 및 iframe fullscreen 권한으로 계속 활성화됩니다.

    ytPlayer.value = new window.YT.Player('youtube-player-div', {
      height: '100%',
      width: '100%',
      playerVars: { 
        autoplay: 0, 
        playsinline: 1,
        fs: 1,
        enablejsapi: 1,
        origin: window.location.origin
      },
      events: {
        onReady: (event) => {
          // iOS Safari/Chrome/Brave에서 YouTube iframe의 네이티브 전체화면 권한을 명시합니다.
          try {
            const iframe = event.target?.getIframe?.()
            if (iframe) {
              iframe.setAttribute('allowfullscreen', '')
              const currentAllow = iframe.getAttribute('allow') || ''
              if (!/(^|;\s*)fullscreen($|;)/i.test(currentAllow)) {
                iframe.setAttribute('allow', currentAllow ? `${currentAllow}; fullscreen` : 'fullscreen')
              }
            }
          } catch (error) {
            console.debug('YouTube 전체화면 권한 설정 건너뜀:', error)
          }
        },
        onStateChange: async (event) => {
          if (event.data === 1) {
            // 영상 로딩이 완료된 뒤 이어보기 위치를 적용해 seek 경쟁 상태를 방지합니다.
            const pending = pendingResumeSeek.value
            if (pending && activeVideo.value && pending.videoId === activeVideo.value.id &&
                ytPlayer.value && typeof ytPlayer.value.seekTo === 'function') {
              ytPlayer.value.seekTo(pending.seconds, true)
              pendingResumeSeek.value = null
            }
            // 재생 시작/영상 전환 후에도 라디오 모드 화질 설정을 다시 요청합니다.
            applyRadioPlaybackQuality()
            if ('mediaSession' in navigator) {
              navigator.mediaSession.playbackState = 'playing'
            }
          } else if (event.data === 2) {
            if ('mediaSession' in navigator) {
              navigator.mediaSession.playbackState = 'paused'
            }
          } else if (event.data === 0) {
            if (isLoopMode.value) {
              if (ytPlayer.value && typeof ytPlayer.value.seekTo === 'function') {
                ytPlayer.value.seekTo(0, true)
                ytPlayer.value.playVideo()
              }
              return
            }

            if (activeVideo.value) {
              try {
                const db = await openDB()
                const tx = db.transaction('history', 'readwrite')
                tx.objectStore('history').delete(activeVideo.value.id)
                
                const targetVideo = videos.value.find(v => v.id === activeVideo.value.id)
                if (targetVideo) {
                  targetVideo.currentTime = 0
                  targetVideo.progressPercent = 0
                  targetVideo.historyUpdatedAt = null
                }
              } catch (err) {
                console.error('이어보기 기록 삭제 실패:', err)
              }
            }

            if (playlistIndex.value < playlistQueue.value.length - 1) {
              await playNextInQueue()
            } else {
              if (activePlaylistId.value) {
                localStorage.removeItem(`neontube_playlist_last_index_${activePlaylistId.value}`)
              }
            }
          }
        }
      }
    })
  }

  if (window.YT && window.YT.Player) {
    createPlayerInstance()
  } else {
    if (!window.onYouTubeIframeAPIReady) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
      } else {
        document.head.appendChild(tag)
      }
    }
    window.onYouTubeIframeAPIReady = () => createPlayerInstance()
  }
}

// Fallback용 기존 초기화 함수 유지
const initYouTubePlayer = (youtubeId, startTime) => {
  const startPos = startTime > 5 ? startTime : 0
  if (ytPlayer.value && typeof ytPlayer.value.loadVideoById === 'function') {
    ytPlayer.value.loadVideoById({ videoId: youtubeId, startSeconds: startPos, ...(isAudioOnlyMode.value ? { suggestedQuality: 'tiny' } : {}) })
    ytPlayer.value.playVideo()
    startHistoryTracker()
  } else {
    initPreloadedYouTubePlayer()
  }
}

const startHistoryTracker = () => {
  stopHistoryTracker()
  historyInterval = setInterval(async () => {
    if (ytPlayer.value && typeof ytPlayer.value.getCurrentTime === 'function' && typeof ytPlayer.value.getDuration === 'function') {
      try {
        const t = ytPlayer.value.getCurrentTime()
        const dur = ytPlayer.value.getDuration()
        if (t && t > 0 && dur && dur > 0) {
          if (dur - t <= 5 && !isLoopMode.value) {
            currentPlayingTime = 0
            if (activeVideo.value) {
              const db = await openDB()
              const tx = db.transaction('history', 'readwrite')
              tx.objectStore('history').delete(activeVideo.value.id)
              
              const targetVideo = videos.value.find(v => v.id === activeVideo.value.id)
              if (targetVideo) {
                targetVideo.currentTime = 0
                targetVideo.progressPercent = 0
                targetVideo.historyUpdatedAt = null
              }
            }
          } else {
            currentPlayingTime = Math.floor(t)
            saveCurrentHistoryToDB()
          }
        }
      } catch (e) { console.debug(e) }
    }
  }, 1000)
}

const stopHistoryTracker = () => {
  if (historyInterval) {
    clearInterval(historyInterval)
    historyInterval = null
  }
}

const saveCurrentHistoryToDB = async () => {
  if (!activeVideo.value || currentPlayingTime <= 0) return
  const dur = (ytPlayer.value && typeof ytPlayer.value.getDuration === 'function') ? ytPlayer.value.getDuration() : (activeVideo.value.duration || 0)

  try {
    const db = await openDB()
    const tx = db.transaction('history', 'readwrite')
    tx.objectStore('history').put({
      videoId: activeVideo.value.id,
      currentTime: Math.floor(currentPlayingTime),
      duration: dur,
      updatedAt: new Date().toISOString()
    })
    
    const targetVideo = videos.value.find(v => v.id === activeVideo.value.id)
    if (targetVideo) {
      targetVideo.currentTime = Math.floor(currentPlayingTime)
      targetVideo.duration = dur
      targetVideo.historyUpdatedAt = new Date().toISOString()
      if (dur > 0) targetVideo.progressPercent = Math.min(100, Math.floor((currentPlayingTime / dur) * 100))
    }
  } catch (err) { console.error(err) }
}

const jumpToTime = () => {
  const totalSeconds = (Number(jumpMinutes.value) || 0) * 60 + (Number(jumpSeconds.value) || 0)
  if (totalSeconds < 0) return
  currentPlayingTime = totalSeconds
  saveCurrentHistoryToDB()
  if (ytPlayer.value && typeof ytPlayer.value.seekTo === 'function') ytPlayer.value.seekTo(totalSeconds, true)
}

const cumulativeJump = (direction) => {
  const stepSeconds = (Number(jumpMinutes.value) || 0) * 60 + (Number(jumpSeconds.value) || 0)
  if (stepSeconds <= 0) return

  let currentTime = currentPlayingTime
  if (ytPlayer.value && typeof ytPlayer.value.getCurrentTime === 'function') {
    try { currentTime = ytPlayer.value.getCurrentTime() } catch (e) { console.debug(e) }
  }

  const targetSeconds = Math.max(0, currentTime + (stepSeconds * direction))
  currentPlayingTime = targetSeconds
  saveCurrentHistoryToDB()
  if (ytPlayer.value && typeof ytPlayer.value.seekTo === 'function') ytPlayer.value.seekTo(targetSeconds, true)
}

const formatRelativeTime = (dateString) => {
  if (!dateString) return ''
  const diffSec = Math.floor((new Date() - new Date(dateString)) / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffDay > 0) return dateString.substring(0, 10)
  if (diffHour > 0) return `${diffHour}시간 전`
  if (diffMin > 0) return `${diffMin}분 전`
  return '방금 전'
}

const fetchVideoCommentCount = async (youtubeId) => {
  if (API_KEYS.length === 0) return
  try {
    const data = await fetchWithKeyRotation((key) => `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${youtubeId}&key=${key}`)
    if (data.items) totalCommentCount.value = parseInt(data.items[0].statistics.commentCount || 0, 10)
  } catch (err) { console.error(err) }
}

const changeCommentsOrder = (order) => {
  if (commentsOrder.value === order) return
  commentsOrder.value = order
  comments.value = []
  commentsNextPageToken.value = null
  activeExpandedCommentId.value = null
  if (activeVideo.value) fetchComments(activeVideo.value.youtubeId)
}

const topLevelComments = computed(() => comments.value.filter(c => !c.isReply))
const getRepliesForComment = (parentId) => comments.value.filter(c => c.isReply && c.parentId === parentId)

const fetchOrToggleReplies = async (comment) => {
  if (activeExpandedCommentId.value === comment.id) {
    activeExpandedCommentId.value = null
  } else {
    activeExpandedCommentId.value = comment.id
    if (!comment.repliesLoaded || getRepliesForComment(comment.id).length === 0) {
      await fetchRepliesForComment(comment)
    }
  }
}

const fetchComments = async (youtubeId) => {
  if (API_KEYS.length === 0) return
  isLoadingComments.value = true
  fetchVideoCommentCount(youtubeId)

  try {
    const data = await fetchWithKeyRotation((key) => 
      `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet,replies&maxResults=15&order=${commentsOrder.value}&videoId=${youtubeId}&key=${key}`
    )
    if (data.items) {
      const currentCreatorId = activeVideo.value?.creatorId
      const parsedComments = []

      data.items.forEach(item => {
        const topSnippet = item.snippet.topLevelComment.snippet
        const topAuthorChannelId = topSnippet.authorChannelId?.value
        const replyCount = item.snippet.totalReplyCount || 0

        parsedComments.push({
          id: item.id,
          author: topSnippet.authorDisplayName,
          authorProfileImageUrl: topSnippet.authorProfileImageUrl,
          authorChannelId: topAuthorChannelId,
          text: topSnippet.textDisplay,
          publishedAt: topSnippet.publishedAt.substring(0, 10),
          likeCount: topSnippet.likeCount || 0,
          isOwner: Boolean(currentCreatorId && topAuthorChannelId === currentCreatorId),
          isReply: false,
          replyCount,
          repliesLoaded: replyCount <= 5
        })

        if (item.replies && item.replies.comments) {
          item.replies.comments.forEach(replyItem => {
            const rSnippet = replyItem.snippet
            const rAuthorChannelId = rSnippet.authorChannelId?.value
            parsedComments.push({
              id: replyItem.id,
              author: rSnippet.authorDisplayName,
              authorProfileImageUrl: rSnippet.authorProfileImageUrl,
              authorChannelId: rAuthorChannelId,
              text: rSnippet.textDisplay,
              publishedAt: rSnippet.publishedAt.substring(0, 10),
              likeCount: rSnippet.likeCount || 0,
              isOwner: Boolean(currentCreatorId && rAuthorChannelId === currentCreatorId),
              isReply: true,
              parentId: item.id
            })
          })
        }
      })

      comments.value = parsedComments
      commentsNextPageToken.value = data.nextPageToken || null
    }
  } catch (err) { console.error(err) } finally { isLoadingComments.value = false }
}

const fetchRepliesForComment = async (parentComment) => {
  if (API_KEYS.length === 0) return
  isLoadingReplies.value = true
  try {
    const data = await fetchWithKeyRotation((key) => 
      `https://www.googleapis.com/youtube/v3/comments?part=snippet&parentId=${parentComment.id}&maxResults=50&key=${key}`
    )
    if (data.items) {
      const currentCreatorId = activeVideo.value?.creatorId
      const newReplies = data.items.map(replyItem => {
        const rSnippet = replyItem.snippet
        const rAuthorChannelId = rSnippet.authorChannelId?.value
        return {
          id: replyItem.id,
          author: rSnippet.authorDisplayName,
          authorProfileImageUrl: rSnippet.authorProfileImageUrl,
          authorChannelId: rAuthorChannelId,
          text: rSnippet.textDisplay,
          publishedAt: rSnippet.publishedAt.substring(0, 10),
          likeCount: rSnippet.likeCount || 0,
          isOwner: Boolean(currentCreatorId && rAuthorChannelId === currentCreatorId),
          isReply: true,
          parentId: parentComment.id
        }
      })

      const existingIds = new Set(comments.value.map(c => c.id))
      const uniqueReplies = newReplies.filter(r => !existingIds.has(r.id))

      comments.value.push(...uniqueReplies)
      parentComment.repliesLoaded = true
    }
  } catch (err) { console.error(err) } finally { isLoadingReplies.value = false }
}

const fetchMoreComments = async (youtubeId) => {
  if (API_KEYS.length === 0 || !commentsNextPageToken.value) return
  isLoadingComments.value = true
  try {
    const data = await fetchWithKeyRotation((key) => 
      `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet,replies&maxResults=15&order=${commentsOrder.value}&pageToken=${commentsNextPageToken.value}&videoId=${youtubeId}&key=${key}`
    )
    if (data.items) {
      const currentCreatorId = activeVideo.value?.creatorId
      const moreParsedComments = []

      data.items.forEach(item => {
        const topSnippet = item.snippet.topLevelComment.snippet
        const topAuthorChannelId = topSnippet.authorChannelId?.value
        const replyCount = item.snippet.totalReplyCount || 0

        moreParsedComments.push({
          id: item.id,
          author: topSnippet.authorDisplayName,
          authorProfileImageUrl: topSnippet.authorProfileImageUrl,
          authorChannelId: topAuthorChannelId,
          text: topSnippet.textDisplay,
          publishedAt: topSnippet.publishedAt.substring(0, 10),
          likeCount: topSnippet.likeCount || 0,
          isOwner: Boolean(currentCreatorId && topAuthorChannelId === currentCreatorId),
          isReply: false,
          replyCount,
          repliesLoaded: replyCount <= 5
        })

        if (item.replies && item.replies.comments) {
          item.replies.comments.forEach(replyItem => {
            const rSnippet = replyItem.snippet
            const rAuthorChannelId = rSnippet.authorChannelId?.value
            moreParsedComments.push({
              id: replyItem.id,
              author: replyItem.id,
              authorProfileImageUrl: rSnippet.authorProfileImageUrl,
              authorChannelId: rAuthorChannelId,
              text: rSnippet.textDisplay,
              publishedAt: rSnippet.publishedAt.substring(0, 10),
              likeCount: rSnippet.likeCount || 0,
              isOwner: Boolean(currentCreatorId && rAuthorChannelId === currentCreatorId),
              isReply: true,
              parentId: item.id
            })
          })
        }
      })

      comments.value.push(...moreParsedComments)
      commentsNextPageToken.value = data.nextPageToken || null
    }
  } catch (err) { console.error(err) } finally { isLoadingComments.value = false }
}

const loadDataFromDB = async () => {
  const db = await openDB()
  
  creators.value = (await new Promise((resolve) => {
    db.transaction('creators', 'readonly').objectStore('creators').getAll().onsuccess = (e) => resolve(e.target.result)
  }) || []).map(c => ({ ...c, isFavorite: c.isFavorite ?? false }))

  let dbGroups = await new Promise((resolve) => {
    db.transaction('playlistGroups', 'readonly').objectStore('playlistGroups').getAll().onsuccess = (e) => resolve(e.target.result)
  })
  if (!dbGroups || dbGroups.length === 0) {
    dbGroups = [
      { id: 'g_default', name: '기본', order: 0 },
      { id: 'g_music', name: '음악', order: 1 }
    ]
    const tx = db.transaction('playlistGroups', 'readwrite')
    dbGroups.forEach(g => tx.objectStore('playlistGroups').put(g))
  } else {
    if (!dbGroups.some(g => g.name === '음악')) {
      const musicGroup = { id: 'g_music', name: '음악', order: dbGroups.length }
      dbGroups.push(musicGroup)
      const tx = db.transaction('playlistGroups', 'readwrite')
      tx.objectStore('playlistGroups').put(musicGroup)
    }
  }
  playlistGroups.value = dbGroups.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  const dbVideos = await new Promise((resolve) => {
    db.transaction('videos', 'readonly').objectStore('videos').getAll().onsuccess = (e) => resolve(e.target.result)
  })

  const dbHistory = await new Promise((resolve) => {
    db.transaction('history', 'readonly').objectStore('history').getAll().onsuccess = (e) => resolve(e.target.result)
  })
  
  historyList.value = dbHistory || []
  const historyMap = new Map(historyList.value.map(h => [h.videoId, h]))
  
  videos.value = (dbVideos || []).map(v => {
    const h = historyMap.get(v.id)
    const videoDuration = h?.duration || v.duration || 0
    const currentTime = h?.currentTime || 0
    let percent = (currentTime > 0 && videoDuration > 0) ? Math.min(100, Math.floor((currentTime / videoDuration) * 100)) : 0
    const isShorts = v.isShorts || (videoDuration > 0 && videoDuration <= 120)
    return { ...v, duration: videoDuration, currentTime, progressPercent: percent, historyUpdatedAt: h?.updatedAt || null, isShorts }
  }).sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))

  checkThumbnailAspectRatio(videos.value)

  const rawPlaylists = (await new Promise((resolve) => {
    db.transaction('playlists', 'readonly').objectStore('playlists').getAll().onsuccess = (e) => resolve(e.target.result)
  }) || [])

  const musicGroupObj = playlistGroups.value.find(g => g.name === '음악')
  const defaultGroupObj = playlistGroups.value.find(g => g.name === '기본' || g.id === 'g_default')

  rawPlaylists.forEach(pl => {
    if (musicGroupObj && defaultGroupObj && pl.groupId === defaultGroupObj.id && (pl.name.includes('음악') || pl.name === '음악')) {
      pl.groupId = musicGroupObj.id
      db.transaction('playlists', 'readwrite').objectStore('playlists').put(pl)
    }
  })

  playlists.value = rawPlaylists.map(pl => ({
    ...pl,
    groupId: pl.groupId || 'g_default'
  })).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  playlistItems.value = await new Promise((resolve) => {
    db.transaction('playlistItems', 'readonly').objectStore('playlistItems').getAll().onsuccess = (e) => resolve(e.target.result)
  }) || []

  loadPlaylistResumeStates()
}

const toggleVideoFavorite = async (video) => {
  video.isFavorite = !video.isFavorite
  const db = await openDB()
  db.transaction('videos', 'readwrite').objectStore('videos').put(JSON.parse(JSON.stringify(video)))
}

const toggleCreatorFavorite = async (creator) => {
  creator.isFavorite = !creator.isFavorite
  const db = await openDB()
  db.transaction('creators', 'readwrite').objectStore('creators').put(JSON.parse(JSON.stringify(creator)))
}

const toggleSubscribeFromCard = async (video) => {
  const existingIndex = creators.value.findIndex(c => c.id === video.creatorId)
  const db = await openDB()

  if (existingIndex !== -1) {
    const targetCreator = creators.value[existingIndex]
    if (!await showAppConfirm(`'${targetCreator.name}' 채널 구독을 취소하시겠습니까?`)) return
    creators.value.splice(existingIndex, 1)
    db.transaction('creators', 'readwrite').objectStore('creators').delete(targetCreator.id)
    if (selectedCreator.value?.id === targetCreator.id) selectDiscoverHeart()
  } else {
    let realSubCount = '구독중'
    try {
      const channelData = await fetchWithKeyRotation((key) => 
        `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${video.creatorId}&key=${key}`
      )
      if (channelData.items && channelData.items.length > 0) {
        const stat = channelData.items[0].statistics
        const rawCount = stat?.hiddenSubscriberCount ? null : parseInt(stat?.subscriberCount || 0, 10)
        realSubCount = rawCount === null ? '구독자 숨김' : (rawCount >= 10000 ? (rawCount / 10000).toFixed(1) + '만명' : rawCount + '명')
      }
    } catch (e) {
      console.error(e)
    }

    const newCreator = { 
      id: video.creatorId, 
      name: video.creatorName, 
      subCount: realSubCount, 
      avatar: video.thumbnail || 'https://cdn.vuetifyjs.com/images/lists/1.jpg', 
      isFavorite: false 
    }
    creators.value.push(newCreator)
    db.transaction('creators', 'readwrite').objectStore('creators').put(newCreator)
    await fetchChannelVideosParallel([newCreator])
    showAppAlert(`'${newCreator.name}' 채널을 구독했습니다!`)
  }
}

const toggleSubscribeFromPlayer = async () => {
  if (!activeVideo.value) return
  await toggleSubscribeFromCard(activeVideo.value)
}

const unsubscribeCreator = async (creator) => {
  if (!await showAppConfirm(`'${creator.name}' 채널 구독을 취소하시겠습니까?`)) return
  creators.value = creators.value.filter(c => c.id !== creator.id)
  const db = await openDB()
  db.transaction('creators', 'readwrite').objectStore('creators').delete(creator.id)
  if (selectedCreator.value?.id === creator.id) selectDiscoverHeart()
}

const fetchChannelVideosParallel = async (targetCreators) => {
  if (!targetCreators || targetCreators.length === 0 || API_KEYS.length === 0) return
  
  for (let i = 0; i < targetCreators.length; i += 50) {
    const chunk = targetCreators.slice(i, i + 50)
    const channelIds = chunk.map(c => c.id).join(',')
    try {
      const channelData = await fetchWithKeyRotation((key) => 
        `https://www.googleapis.com/youtube/v3/channels?part=contentDetails,statistics&id=${channelIds}&key=${key}`
      )
      if (channelData.error || !channelData.items) continue

      const channelMap = new Map()
      channelData.items.forEach(item => {
        const stat = item.statistics
        const rawCount = stat?.hiddenSubscriberCount ? null : parseInt(stat?.subscriberCount || 0, 10)
        const formattedSubCount = rawCount === null 
          ? '구독자 숨김' 
          : rawCount >= 10000 
            ? (rawCount / 10000).toFixed(1) + '만명' 
            : rawCount >= 1000 
              ? (rawCount / 1000).toFixed(1) + '천명' 
              : rawCount + '명'

        const targetCreator = chunk.find(c => c.id === item.id)
        if (targetCreator) {
          targetCreator.subCount = formattedSubCount
          openDB().then(db => {
            db.transaction('creators', 'readwrite').objectStore('creators').put(JSON.parse(JSON.stringify(targetCreator)))
          })
        }

        channelMap.set(item.id, {
          uploadsPlaylistId: item.contentDetails.relatedPlaylists.uploads,
          subCount: formattedSubCount
        })
      })

      await Promise.all(chunk.map(async (creator) => {
        const chInfo = channelMap.get(creator.id)
        if (!chInfo) return

        const data = await fetchWithKeyRotation((key) => 
          `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=25&playlistId=${chInfo.uploadsPlaylistId}&key=${key}`
        )

        if (!data.error && data.items) {
          if (data.nextPageToken) {
            channelNextPageTokens.value.set(creator.id, data.nextPageToken)
          } else {
            channelNextPageTokens.value.delete(creator.id)
          }

          const db = await openDB()
          const existingMap = new Map(videos.value.map(v => [v.id, { isFavorite: v.isFavorite, progressPercent: v.progressPercent, currentTime: v.currentTime, duration: v.duration, historyUpdatedAt: v.historyUpdatedAt, views: v.views }]))

          const channelVideos = data.items.map(item => {
            const snippet = item.snippet
            const videoId = snippet.resourceId?.videoId || snippet.resourceId
            const title = snippet.title.toLowerCase()
            const thumbUrl = snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url
            const isShorts = title.includes('#shorts') || title.includes('shorts') || title.includes('#쇼츠')

            const parsed = {
              id: videoId,
              youtubeId: videoId,
              creatorId: snippet.channelId,
              creatorName: snippet.channelTitle,
              creatorSubCount: chInfo.subCount,
              title: snippet.title,
              thumbnail: thumbUrl,
              isShorts: isShorts,
              isFavorite: false,
              views: 0,
              publishedAt: snippet.publishedAt,
              duration: 0,
              progressPercent: 0,
              currentTime: 0,
              historyUpdatedAt: null
            }

            if (existingMap.has(parsed.id)) {
              const ex = existingMap.get(parsed.id)
              Object.assign(parsed, ex)
            }
            return parsed
          })

          await fetchAndUpdateVideoDetails(channelVideos)
          checkThumbnailAspectRatio(channelVideos)

          const tx = db.transaction('videos', 'readwrite')
          const store = tx.objectStore('videos')
          channelVideos.forEach(v => store.put(v))
          
          channelVideos.forEach(cv => {
            if (!videos.value.some(v => v.id === cv.id)) {
              videos.value.push(cv)
            }
          })
        }
      }))
    } catch (err) {
      console.error('채널 일괄 로드 실패:', err)
    }
  }

  videos.value.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))
}

const fetchTrendingVideos = async () => {
  if (API_KEYS.length === 0) return
  isLoading.value = true
  trendingNextPageToken.value = null

  try {
    const data = await fetchWithKeyRotation((key) => 
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&chart=mostPopular&regionCode=KR&maxResults=25&key=${key}`
    )

    if (data.error || !data.items) return

    trendingNextPageToken.value = data.nextPageToken || null

    const channelIds = [...new Set(data.items.map(item => item.snippet?.channelId).filter(Boolean))]
    const subCountMap = await fetchSubscriberCountsForChannelIds(channelIds)

    const db = await openDB()
    const dbHistory = await new Promise((resolve) => {
      db.transaction('history', 'readonly').objectStore('history').getAll().onsuccess = (e) => resolve(e.target.result)
    })
    const historyMap = new Map((dbHistory || []).map(h => [h.videoId, h]))
    const existingMap = new Map(videos.value.map(v => [v.id, v.isFavorite]))

    const parsedTrending = data.items.map(item => {
      const snippet = item.snippet
      const videoId = item.id
      const title = snippet.title.toLowerCase()
      const thumbUrl = snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url
      const dur = parseISO8601Duration(item.contentDetails?.duration)
      const viewsCount = parseInt(item.statistics?.viewCount || 0, 10)
      const isShorts = title.includes('#shorts') || title.includes('shorts') || title.includes('#쇼츠') || (dur > 0 && dur <= 120)
      const channelId = snippet.channelId
      const matchedCreator = creators.value.find(c => c.id === channelId)
      const subCount = matchedCreator ? matchedCreator.subCount : (subCountMap.get(channelId) || '')

      const parsed = {
        id: videoId,
        youtubeId: videoId,
        creatorId: channelId,
        creatorName: snippet.channelTitle,
        creatorSubCount: subCount,
        title: snippet.title,
        thumbnail: thumbUrl,
        isShorts,
        isFavorite: existingMap.get(videoId) || false,
        views: viewsCount,
        publishedAt: snippet.publishedAt,
        duration: dur,
        progressPercent: 0,
        currentTime: 0,
        historyUpdatedAt: null
      }

      const h = historyMap.get(parsed.id)
      if (h) {
        parsed.currentTime = h.currentTime || 0
        parsed.duration = h.duration || parsed.duration
        parsed.historyUpdatedAt = h.updatedAt || null
        if (parsed.currentTime > 0 && parsed.duration > 0) {
          parsed.progressPercent = Math.min(100, Math.floor((parsed.currentTime / parsed.duration) * 100))
        }
      }
      return parsed
    })

    checkThumbnailAspectRatio(parsedTrending)
    trendingVideos.value = parsedTrending

    const tx = db.transaction('videos', 'readwrite')
    const store = tx.objectStore('videos')
    parsedTrending.forEach(v => store.put(v))
  } catch (error) {
    console.error('실시간 급상승 영상 불러오기 실패:', error)
  } finally {
    isLoading.value = false
  }
}

const fetchAlgorithmVideos = async () => {
  if (API_KEYS.length === 0) return
  isLoading.value = true
  algorithmNextPageToken.value = null

  try {
    const seedKeywords = new Set()
    
    historyList.value.slice(0, 10).forEach(h => {
      const v = videos.value.find(vid => vid.id === h.videoId)
      if (v && v.title) {
        const cleanWords = v.title.replace(/\[.*?\]|\(.*?\)|[^\w\s가-힣]/g, ' ').split(/\s+/).filter(w => w.length >= 2)
        cleanWords.slice(0, 2).forEach(w => seedKeywords.add(w))
      }
    })

    videos.value.filter(v => v.isFavorite).slice(0, 5).forEach(v => {
      const cleanWords = v.title.replace(/\[.*?\]|\(.*?\)|[^\w\s가-힣]/g, ' ').split(/\s+/).filter(w => w.length >= 2)
      cleanWords.slice(0, 2).forEach(w => seedKeywords.add(w))
    })

    creators.value.slice(0, 5).forEach(c => seedKeywords.add(c.name))

    const defaultKeywords = ['인기 이슈', '알고리즘 추천', '트렌드 모음', '브이로그', 'IT 테크 리뷰', '게임 핫하이라이트']
    const mergedKeywords = [...Array.from(seedKeywords), ...defaultKeywords]
    const randomQuery = mergedKeywords[Math.floor(Math.random() * mergedKeywords.length)]

    const [searchRes, trendingRes] = await Promise.allSettled([
      fetchWithKeyRotation((key) => `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(randomQuery)}&type=video&key=${key}`),
      fetchWithKeyRotation((key) => `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&chart=mostPopular&regionCode=KR&maxResults=15&key=${key}`)
    ])

    let candidateVideos = []

    if (searchRes.status === 'fulfilled' && searchRes.value?.items) {
      algorithmNextPageToken.value = searchRes.value.nextPageToken || null
      const channelIds = searchRes.value.items.map(item => item.snippet?.channelId).filter(Boolean)
      const subCountMap = await fetchSubscriberCountsForChannelIds(channelIds)
      const existingMap = new Map(videos.value.map(v => [v.id, v.isFavorite]))

      const searchParsed = searchRes.value.items.filter(item => item.id?.videoId).map(item => {
        const snippet = item.snippet
        const videoId = item.id.videoId
        const title = snippet.title.toLowerCase()
        const thumbUrl = snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url
        const channelId = snippet.channelId

        return {
          id: videoId,
          youtubeId: videoId,
          creatorId: channelId,
          creatorName: snippet.channelTitle,
          creatorSubCount: subCountMap.get(channelId) || '',
          title: snippet.title,
          thumbnail: thumbUrl,
          isShorts: title.includes('#shorts') || title.includes('shorts') || title.includes('#쇼츠'),
          isFavorite: existingMap.get(videoId) || false,
          views: 0,
          publishedAt: snippet.publishedAt,
          duration: 0,
          progressPercent: 0,
          currentTime: 0,
          historyUpdatedAt: null
        }
      })
      candidateVideos.push(...searchParsed)
    }

    if (trendingRes.status === 'fulfilled' && trendingRes.value?.items) {
      const channelIds = trendingRes.value.items.map(item => item.snippet?.channelId).filter(Boolean)
      const subCountMap = await fetchSubscriberCountsForChannelIds(channelIds)
      const existingMap = new Map(videos.value.map(v => [v.id, v.isFavorite]))

      const trendingParsed = trendingRes.value.items.map(item => {
        const snippet = item.snippet
        const videoId = item.id
        const title = snippet.title.toLowerCase()
        const thumbUrl = snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url
        const channelId = snippet.channelId
        const dur = parseISO8601Duration(item.contentDetails?.duration)
        const viewsCount = parseInt(item.statistics?.viewCount || 0, 10)

        return {
          id: videoId,
          youtubeId: videoId,
          creatorId: channelId,
          creatorName: snippet.channelTitle,
          creatorSubCount: subCountMap.get(channelId) || '',
          title: snippet.title,
          thumbnail: thumbUrl,
          isShorts: title.includes('#shorts') || title.includes('shorts') || title.includes('#쇼츠') || (dur > 0 && dur <= 120),
          isFavorite: existingMap.get(videoId) || false,
          views: viewsCount,
          publishedAt: snippet.publishedAt,
          duration: dur,
          progressPercent: 0,
          currentTime: 0,
          historyUpdatedAt: null
        }
      })
      candidateVideos.push(...trendingParsed)
    }

    const uniqueMap = new Map()
    candidateVideos.forEach(v => {
      if (!uniqueMap.has(v.id)) uniqueMap.set(v.id, v)
    })
    
    let combined = Array.from(uniqueMap.values())
    for (let i = combined.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [combined[i], combined[j]] = [combined[j], combined[i]]
    }

    await fetchAndUpdateVideoDetails(combined)
    checkThumbnailAspectRatio(combined)
    algorithmVideos.value = combined
  } catch (error) {
    console.error('알고리즘 추천 로드 실패:', error)
  } finally {
    isLoading.value = false
  }
}

const loadMoreAlgorithmVideos = async () => {
  if (API_KEYS.length === 0 || !algorithmNextPageToken.value || isLoading.value) return
  isLoading.value = true

  try {
    const recommendationKeywords = ['인기 추천 컨텐츠', '요즘 뜨는 트렌드', '알고리즘 추천 영상', '재밌는 영상 모음', '브이로그 추천', 'IT 테크 리뷰']
    const randomQuery = recommendationKeywords[Math.floor(Math.random() * recommendationKeywords.length)]

    const data = await fetchWithKeyRotation((key) => 
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(randomQuery)}&pageToken=${algorithmNextPageToken.value}&type=video&key=${key}`
    )

    if (data.error || !data.items) {
      algorithmNextPageToken.value = null
      isLoading.value = false
      return
    }

    algorithmNextPageToken.value = data.nextPageToken || null

    const channelIds = [...new Set(data.items.map(item => item.snippet?.channelId).filter(Boolean))]
    const subCountMap = await fetchSubscriberCountsForChannelIds(channelIds)
    const existingMap = new Map(videos.value.map(v => [v.id, v.isFavorite]))

    const parsed = data.items.filter(item => item.id?.videoId).map(item => {
      const snippet = item.snippet
      const videoId = item.id.videoId
      const title = snippet.title.toLowerCase()
      const thumbUrl = snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url
      const channelId = snippet.channelId

      return {
        id: videoId,
        youtubeId: videoId,
        creatorId: channelId,
        creatorName: snippet.channelTitle,
        creatorSubCount: subCountMap.get(channelId) || '',
        title: snippet.title,
        thumbnail: thumbUrl,
        isShorts: title.includes('#shorts') || title.includes('shorts') || title.includes('#쇼츠'),
        isFavorite: existingMap.get(videoId) || false,
        views: 0,
        publishedAt: snippet.publishedAt,
        duration: 0,
        progressPercent: 0,
        currentTime: 0,
        historyUpdatedAt: null
      }
    })

    await fetchAndUpdateVideoDetails(parsed)
    checkThumbnailAspectRatio(parsed)
    
    const existingIds = new Set(algorithmVideos.value.map(v => v.id))
    parsed.forEach(v => {
      if (!existingIds.has(v.id)) algorithmVideos.value.push(v)
    })
  } catch (error) {
    console.error('알고리즘 추가 로드 실패:', error)
  } finally {
    isLoading.value = false
  }
}

const fetchMusicVideos = async (query = '인기 가요 믹스') => {
  if (API_KEYS.length === 0) return
  isLoading.value = true

  try {
    const data = await fetchWithKeyRotation((key) => 
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=25&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&key=${key}`
    )
    if (data.error || !data.items) return

    const channelIds = [...new Set(data.items.map(item => item.snippet?.channelId).filter(Boolean))]
    const subCountMap = await fetchSubscriberCountsForChannelIds(channelIds)

    const db = await openDB()
    const dbHistory = await new Promise((resolve) => {
      db.transaction('history', 'readonly').objectStore('history').getAll().onsuccess = (e) => resolve(e.target.result)
    })
    const historyMap = new Map((dbHistory || []).map(h => [h.videoId, h]))
    const existingMap = new Map(videos.value.map(v => [v.id, v.isFavorite]))

    const parsedMusic = data.items.filter(item => item.id?.videoId).map(item => {
      const snippet = item.snippet
      const videoId = item.id.videoId
      const thumbUrl = snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url
      const channelId = snippet.channelId
      const matchedCreator = creators.value.find(c => c.id === channelId)
      const subCount = matchedCreator ? matchedCreator.subCount : (subCountMap.get(channelId) || '')

      const parsed = {
        id: videoId,
        youtubeId: videoId,
        creatorId: channelId,
        creatorName: snippet.channelTitle,
        creatorSubCount: subCount,
        title: snippet.title,
        thumbnail: thumbUrl,
        isShorts: false,
        isFavorite: existingMap.get(videoId) || false,
        views: 0,
        publishedAt: snippet.publishedAt,
        duration: 0,
        progressPercent: 0,
        currentTime: 0,
        historyUpdatedAt: null
      }

      const h = historyMap.get(parsed.id)
      if (h) {
        parsed.currentTime = h.currentTime || 0
        parsed.duration = h.duration || 0
        parsed.historyUpdatedAt = h.updatedAt || null
        if (parsed.currentTime > 0 && parsed.duration > 0) {
          parsed.progressPercent = Math.min(100, Math.floor((parsed.currentTime / parsed.duration) * 100))
        }
      }
      return parsed
    })

    await fetchAndUpdateVideoDetails(parsedMusic)
    checkThumbnailAspectRatio(parsedMusic)
    musicVideos.value = parsedMusic

    const tx = db.transaction('videos', 'readwrite')
    const store = tx.objectStore('videos')
    parsedMusic.forEach(v => store.put(v))
  } catch (error) {
    console.error('음악 데이터 로드 실패:', error)
  } finally {
    isLoading.value = false
  }
}

const selectMusicCategory = async (catValue) => {
  musicCategory.value = catValue
  let query = '인기 가요 믹스'
  if (catValue === 'ballad') query = '한국 발라드 명곡 믹스'
  else if (catValue === 'dance') query = '아이돌 댄스 노래 믹스'
  else if (catValue === 'lofi') query = 'Lo-Fi 힙합 플레이리스트'
  else if (catValue === 'jazz') query = '재즈 어쿠스틱 음악'

  await fetchMusicVideos(query)
}

const loadMoreTrendingVideos = async () => {
  if (API_KEYS.length === 0 || !trendingNextPageToken.value) return
  isLoading.value = true

  try {
    const data = await fetchWithKeyRotation((key) => 
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&chart=mostPopular&regionCode=KR&maxResults=25&pageToken=${trendingNextPageToken.value}&key=${key}`
    )

    if (data.error || !data.items) return

    trendingNextPageToken.value = data.nextPageToken || null

    const channelIds = [...new Set(data.items.map(item => item.snippet?.channelId).filter(Boolean))]
    const subCountMap = await fetchSubscriberCountsForChannelIds(channelIds)

    const db = await openDB()
    const dbHistory = await new Promise((resolve) => {
      db.transaction('history', 'readonly').objectStore('history').getAll().onsuccess = (e) => resolve(e.target.result)
    })
    const historyMap = new Map((dbHistory || []).map(h => [h.videoId, h]))
    const existingMap = new Map(videos.value.map(v => [v.id, v.isFavorite]))

    const moreTrending = data.items.map(item => {
      const snippet = item.snippet
      const videoId = item.id
      const title = snippet.title.toLowerCase()
      const thumbUrl = snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url
      const dur = parseISO8601Duration(item.contentDetails?.duration)
      const viewsCount = parseInt(item.statistics?.viewCount || 0, 10)
      const isShorts = title.includes('#shorts') || title.includes('shorts') || title.includes('#쇼츠') || (dur > 0 && dur <= 120)
      const channelId = snippet.channelId
      const matchedCreator = creators.value.find(c => c.id === channelId)
      const subCount = matchedCreator ? matchedCreator.subCount : (subCountMap.get(channelId) || '')

      const parsed = {
        id: videoId,
        youtubeId: videoId,
        creatorId: channelId,
        creatorName: snippet.channelTitle,
        creatorSubCount: subCount,
        title: snippet.title,
        thumbnail: thumbUrl,
        isShorts,
        isFavorite: existingMap.get(videoId) || false,
        views: viewsCount,
        publishedAt: snippet.publishedAt,
        duration: dur,
        progressPercent: 0,
        currentTime: 0,
        historyUpdatedAt: null
      }

      const h = historyMap.get(parsed.id)
      if (h) {
        parsed.currentTime = h.currentTime || 0
        parsed.duration = h.duration || parsed.duration
        parsed.historyUpdatedAt = h.updatedAt || null
        if (parsed.currentTime > 0 && parsed.duration > 0) {
          parsed.progressPercent = Math.min(100, Math.floor((parsed.currentTime / parsed.duration) * 100))
        }
      }
      return parsed
    })

    checkThumbnailAspectRatio(moreTrending)
    trendingVideos.value.push(...moreTrending)

    const tx = db.transaction('videos', 'readwrite')
    const store = tx.objectStore('videos')
    moreTrending.forEach(v => store.put(v))
  } catch (error) {
    console.error('실시간 급상승 추가 영상 로드 실패:', error)
  } finally {
    isLoading.value = false
  }
}

const loadMoreChannelVideos = async (creator) => {
  if (API_KEYS.length === 0 || !creator || isLoading.value) return
  const pageToken = channelNextPageTokens.value.get(creator.id)
  if (!pageToken) return
  isLoading.value = true

  try {
    const channelData = await fetchWithKeyRotation((key) => 
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${creator.id}&key=${key}`
    )
    if (channelData.error || !channelData.items || channelData.items.length === 0) {
      isLoading.value = false
      return
    }
    const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads

    const data = await fetchWithKeyRotation((key) => 
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=25&playlistId=${uploadsPlaylistId}&pageToken=${pageToken}&key=${key}`
    )
    if (data.error || !data.items) {
      channelNextPageTokens.value.delete(creator.id)
      isLoading.value = false
      return
    }

    if (data.nextPageToken) {
      channelNextPageTokens.value.set(creator.id, data.nextPageToken)
    } else {
      channelNextPageTokens.value.delete(creator.id)
    }

    const db = await openDB()
    const dbHistory = await new Promise((resolve) => {
      db.transaction('history', 'readonly').objectStore('history').getAll().onsuccess = (e) => resolve(e.target.result)
    })
    const historyMap = new Map((dbHistory || []).map(h => [h.videoId, h]))
    const existingMap = new Map(videos.value.map(v => [v.id, v.isFavorite]))

    const moreVideos = data.items.map(item => {
      const snippet = item.snippet
      const videoId = snippet.resourceId?.videoId || snippet.resourceId
      const title = snippet.title.toLowerCase()
      const thumbUrl = snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url
      const isShorts = title.includes('#shorts') || title.includes('shorts') || title.includes('#쇼츠')

      const parsed = {
        id: videoId,
        youtubeId: videoId,
        creatorId: snippet.channelId,
        creatorName: snippet.channelTitle,
        creatorSubCount: creator.subCount,
        title: snippet.title,
        thumbnail: thumbUrl,
        isShorts,
        isFavorite: existingMap.get(videoId) || false,
        views: 0,
        publishedAt: snippet.publishedAt,
        duration: 0,
        progressPercent: 0,
        currentTime: 0,
        historyUpdatedAt: null
      }

      const h = historyMap.get(parsed.id)
      if (h) {
        parsed.currentTime = h.currentTime || 0
        parsed.duration = h.duration || 0
        parsed.historyUpdatedAt = h.updatedAt || null
        if (parsed.currentTime > 0 && parsed.duration > 0) parsed.progressPercent = Math.min(100, Math.floor((parsed.currentTime / parsed.duration) * 100))
      }
      return parsed
    })

    await fetchAndUpdateVideoDetails(moreVideos)
    checkThumbnailAspectRatio(moreVideos)
    moreVideos.forEach(mv => {
      if (!videos.value.some(v => v.id === mv.id)) {
        videos.value.push(mv)
      }
    })
    videos.value.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))

    const tx = db.transaction('videos', 'readwrite')
    const store = tx.objectStore('videos')
    moreVideos.forEach(v => store.put(v))
  } catch (error) { console.error(error) } finally { isLoading.value = false }
}

const triggerTabSearchOrUpdate = async () => {
  const query = searchQuery.value.trim()
  visibleLimit.value = 40

  if (isPlaylistMode.value || isHistoryMode.value) {
    activeFilterQuery.value = query
    return
  }

  if (currentTab.value === 'discoverAll' && !selectedCreator.value) {
    activeFilterQuery.value = query
    if (creators.value.length > 0) {
      isLoading.value = true
      try {
        await fetchChannelVideosParallel(creators.value)
        await loadDataFromDB()
      } finally {
        isLoading.value = false
      }
    }
    return
  }

  if (currentTab.value === 'discoverHeart' && !selectedCreator.value) {
    activeFilterQuery.value = query
    const heartCreators = creators.value.filter(c => c.isFavorite)
    const targetCreators = heartCreators.length > 0 ? heartCreators : creators.value
    
    if (targetCreators.length > 0) {
      isLoading.value = true
      try {
        await fetchChannelVideosParallel(targetCreators)
        await loadDataFromDB()
      } finally {
        isLoading.value = false
      }
    }
    return
  }

  isLoading.value = true
  try {
    if (isAlgorithmMode.value) {
      activeFilterQuery.value = query
      await fetchAlgorithmVideos()
      return
    }

    if (isMusicMode.value) {
      activeFilterQuery.value = ''
      await fetchMusicVideos(query || '인기 가요 믹스')
      return
    }

    if (isTrendingMode.value) {
      activeFilterQuery.value = query
      await fetchTrendingVideos()
      return
    }

    if (isSearchMode.value) {
      if (query) {
        lastSearchQuery.value = query 
        await searchYouTubeVideos()
      }
      return
    }

    activeFilterQuery.value = query
  } finally {
    isLoading.value = false
  }
}

const handleSearch = async () => {
  visibleLimit.value = 40
  if (isSearchMode.value || isMusicMode.value || isTrendingMode.value || isAlgorithmMode.value || currentTab.value === 'discoverHeart' || currentTab.value === 'discoverAll') {
    await triggerTabSearchOrUpdate()
  } else {
    activeFilterQuery.value = searchQuery.value.trim()
  }
}

const searchYouTubeVideos = async () => {
  if (!searchQuery.value.trim() || API_KEYS.length === 0) return
  const query = searchQuery.value.trim()
  searchNextPageToken.value = null
  
  try {
    const data = await fetchWithKeyRotation((key) => 
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(query)}&type=video&key=${key}`
    )
    if (data.error) return

    searchNextPageToken.value = data.nextPageToken || null
    const db = await openDB()
    const dbHistory = await new Promise((resolve) => {
      db.transaction('history', 'readonly').objectStore('history').getAll().onsuccess = (e) => resolve(e.target.result)
    })
    const historyMap = new Map((dbHistory || []).map(h => [h.videoId, h]))
    const existingMap = new Map(videos.value.map(v => [v.id, v.isFavorite]))

    const channelIds = [...new Set(data.items.filter(item => item.snippet?.channelId).map(item => item.snippet.channelId))]
    const subCountMap = await fetchSubscriberCountsForChannelIds(channelIds)

    const parseSearchItem = (item) => {
      const title = item.snippet.title.toLowerCase()
      const thumbUrl = item.snippet.thumbnails.high ? item.snippet.thumbnails.high.url : item.snippet.thumbnails.default.url
      const channelId = item.snippet.channelId
      
      const matchedCreator = creators.value.find(c => c.id === channelId)
      const subCount = matchedCreator ? matchedCreator.subCount : (subCountMap.get(channelId) || '')

      return {
        id: item.id.videoId,
        youtubeId: item.id.videoId,
        creatorId: channelId,
        creatorName: item.snippet.channelTitle,
        creatorSubCount: subCount,
        title: item.snippet.title,
        thumbnail: thumbUrl,
        isShorts: title.includes('#shorts') || title.includes('shorts') || title.includes('#쇼츠'),
        isFavorite: existingMap.get(item.id.videoId) || false,
        views: 0,
        publishedAt: item.snippet.publishedAt,
        duration: 0,
        progressPercent: 0,
        currentTime: 0,
        historyUpdatedAt: null
      }
    }

    const apiVideos = data.items.filter(item => item.id?.videoId).map(item => {
      const parsed = parseSearchItem(item)
      const h = historyMap.get(parsed.id)
      if (h) {
        parsed.currentTime = h.currentTime || 0
        parsed.duration = h.duration || 0
        parsed.historyUpdatedAt = h.updatedAt || null
        if (parsed.currentTime > 0 && parsed.duration > 0) parsed.progressPercent = Math.min(100, Math.floor((parsed.currentTime / parsed.duration) * 100))
      }
      return parsed
    })

    await fetchAndUpdateVideoDetails(apiVideos)
    checkThumbnailAspectRatio(apiVideos)
    
    apiVideos.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))
    
    const uniqueMap = new Map()
    apiVideos.forEach(v => {
      if (!uniqueMap.has(v.id)) uniqueMap.set(v.id, v)
    })
    searchResultVideos.value = Array.from(uniqueMap.values())

    searchResultVideos.value.forEach(av => {
      if (!videos.value.some(v => v.id === av.id)) {
        videos.value.push(av)
      }
    })
    videos.value.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))

    const dbTx = db.transaction('videos', 'readwrite')
    const store = dbTx.objectStore('videos')
    searchResultVideos.value.forEach(v => {
      store.put(JSON.parse(JSON.stringify(v)))
    })

    await nextTick()
    scrollToTop(mainScrollRef.value)
  } catch (error) { console.error(error) }
}

const loadMoreSearchVideos = async () => {
  if (!searchQuery.value.trim() || !searchNextPageToken.value || API_KEYS.length === 0 || isLoading.value) return
  
  const container = mainScrollRef.value?.$el || mainScrollRef.value
  const currentScrollTop = container ? container.scrollTop : 0

  isLoading.value = true
  try {
    const data = await fetchWithKeyRotation((key) => 
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(searchQuery.value.trim())}&type=video&pageToken=${searchNextPageToken.value}&key=${key}`
    )
    if (data.error || !data.items) {
      searchNextPageToken.value = null
      isLoading.value = false
      return
    }

    searchNextPageToken.value = data.nextPageToken || null
    
    const channelIds = [...new Set(data.items.map(item => item.snippet?.channelId).filter(Boolean))]
    const subCountMap = await fetchSubscriberCountsForChannelIds(channelIds)

    const db = await openDB()
    const moreVideos = data.items.filter(item => item.id?.videoId).map(item => {
      const title = item.snippet.title.toLowerCase()
      const thumbUrl = item.snippet.thumbnails.high ? item.snippet.thumbnails.high.url : item.snippet.thumbnails.default.url
      const channelId = item.snippet.channelId
      const matchedCreator = creators.value.find(c => c.id === channelId)
      const subCount = matchedCreator ? matchedCreator.subCount : (subCountMap.get(channelId) || '')

      return {
        id: item.id.videoId,
        youtubeId: item.id.videoId,
        creatorId: channelId,
        creatorName: item.snippet.channelTitle,
        creatorSubCount: subCount,
        title: item.snippet.title,
        thumbnail: thumbUrl,
        isShorts: title.includes('#shorts') || title.includes('shorts') || title.includes('#쇼츠'),
        isFavorite: false,
        views: 0,
        publishedAt: item.snippet.publishedAt,
        duration: 0,
        progressPercent: 0,
        currentTime: 0,
        historyUpdatedAt: null
      }
    })
    await fetchAndUpdateVideoDetails(moreVideos)
    checkThumbnailAspectRatio(moreVideos)
    
    moreVideos.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))
    
    const existingIds = new Set(searchResultVideos.value.map(v => v.id))
    moreVideos.forEach(mv => {
      if (!existingIds.has(mv.id)) {
        searchResultVideos.value.push(mv)
        existingIds.add(mv.id)
      }
    })
    searchResultVideos.value.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))

    moreVideos.forEach(mv => {
      if (!videos.value.some(v => v.id === mv.id)) {
        videos.value.push(mv)
      }
    })
    videos.value.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))

    const tx = db.transaction('videos', 'readwrite')
    const store = tx.objectStore('videos')
    moreVideos.forEach(v => store.put(v))
  } catch (error) { 
    console.error(error) 
  } finally { 
    isLoading.value = false
    
    await nextTick()
    setTimeout(() => {
      if (container) {
        container.scrollTop = currentScrollTop
      }
    }, 0)
  }
}

const selectDiscoverAll = () => {
  visibleLimit.value = 40
  enableResume.value = true
  selectedCreator.value = null
  currentTab.value = 'discoverAll'
  isSearchMode.value = false
  isTrendingMode.value = false
  isFavoriteVideosMode.value = false
  isHistoryMode.value = false
  isPlaylistMode.value = false
  isMusicMode.value = false
  isAlgorithmMode.value = false
  searchQuery.value = '' 
  activeFilterQuery.value = ''
  if (window.innerWidth < 960) drawer.value = false
  scrollToTop(mainScrollRef.value)
}

const selectDiscoverHeart = () => {
  visibleLimit.value = 40
  enableResume.value = true
  selectedCreator.value = null
  currentTab.value = 'discoverHeart'
  isSearchMode.value = false
  isTrendingMode.value = false
  isFavoriteVideosMode.value = false
  isHistoryMode.value = false
  isPlaylistMode.value = false
  isMusicMode.value = false
  isAlgorithmMode.value = false
  searchQuery.value = '' 
  activeFilterQuery.value = ''
  if (window.innerWidth < 960) drawer.value = false
  scrollToTop(mainScrollRef.value)
}

const enableTrendingMode = async () => {
  visibleLimit.value = 40
  enableResume.value = true
  selectedCreator.value = null
  currentTab.value = ''
  isSearchMode.value = false
  isTrendingMode.value = true
  isFavoriteVideosMode.value = false
  isHistoryMode.value = false
  isPlaylistMode.value = false
  isMusicMode.value = false
  isAlgorithmMode.value = false
  searchQuery.value = '' 
  activeFilterQuery.value = ''
  if (window.innerWidth < 960) drawer.value = false
  if (trendingVideos.value.length === 0) {
    await fetchTrendingVideos()
  }
  scrollToTop(mainScrollRef.value)
}

const enableAlgorithmMode = async () => {
  visibleLimit.value = 40
  enableResume.value = true
  selectedCreator.value = null
  currentTab.value = ''
  isSearchMode.value = false
  isTrendingMode.value = false
  isFavoriteVideosMode.value = false
  isHistoryMode.value = false
  isPlaylistMode.value = false
  isMusicMode.value = false
  isAlgorithmMode.value = true
  searchQuery.value = '' 
  activeFilterQuery.value = ''
  if (window.innerWidth < 960) drawer.value = false
  if (algorithmVideos.value.length === 0) {
    await fetchAlgorithmVideos()
  }
  scrollToTop(mainScrollRef.value)
}

const enableFavoriteVideosMode = () => {
  visibleLimit.value = 40
  enableResume.value = true
  selectedCreator.value = null
  currentTab.value = ''
  isSearchMode.value = false
  isTrendingMode.value = false
  isFavoriteVideosMode.value = true
  isHistoryMode.value = false
  isPlaylistMode.value = false
  isMusicMode.value = false
  isAlgorithmMode.value = false
  searchQuery.value = '' 
  activeFilterQuery.value = ''
  if (window.innerWidth < 960) drawer.value = false
  scrollToTop(mainScrollRef.value)
}

const enableHistoryMode = () => {
  visibleLimit.value = 40
  enableResume.value = true
  selectedCreator.value = null
  currentTab.value = ''
  isSearchMode.value = false
  isTrendingMode.value = false
  isFavoriteVideosMode.value = false
  isHistoryMode.value = true
  isPlaylistMode.value = false
  isMusicMode.value = false
  isAlgorithmMode.value = false
  searchQuery.value = '' 
  activeFilterQuery.value = ''
  if (window.innerWidth < 960) drawer.value = false
  scrollToTop(mainScrollRef.value)
}

const enablePlaylistMode = () => {
  visibleLimit.value = 40
  selectedCreator.value = null
  currentTab.value = ''
  isSearchMode.value = false
  isTrendingMode.value = false
  isFavoriteVideosMode.value = false
  isHistoryMode.value = false
  isPlaylistMode.value = true
  isMusicMode.value = false
  isAlgorithmMode.value = false
  activePlaylistId.value = null
  searchQuery.value = '' 
  activeFilterQuery.value = ''
  if (window.innerWidth < 960) drawer.value = false
  scrollToTop(mainScrollRef.value)
}

const enableSearchMode = () => {
  visibleLimit.value = 40
  enableResume.value = true
  selectedCreator.value = null
  currentTab.value = ''
  isSearchMode.value = true
  isTrendingMode.value = false
  isFavoriteVideosMode.value = false
  isHistoryMode.value = false
  isPlaylistMode.value = false
  isMusicMode.value = false
  isAlgorithmMode.value = false
  
  if (lastSearchQuery.value) {
    searchQuery.value = lastSearchQuery.value
  }
  activeFilterQuery.value = ''

  if (window.innerWidth < 960) drawer.value = false
  scrollToTop(mainScrollRef.value)
}

const enableMusicMode = async () => {
  visibleLimit.value = 40
  enableResume.value = true
  selectedCreator.value = null
  currentTab.value = ''
  isSearchMode.value = false
  isTrendingMode.value = false
  isFavoriteVideosMode.value = false
  isHistoryMode.value = false
  isPlaylistMode.value = false
  isMusicMode.value = true
  isAlgorithmMode.value = false
  searchQuery.value = '' 
  activeFilterQuery.value = ''
  if (window.innerWidth < 960) drawer.value = false
  if (musicVideos.value.length === 0) {
    await fetchMusicVideos('인기 가요 믹스')
  }
  scrollToTop(mainScrollRef.value)
}

const selectCreatorFilter = async (creator) => {
  visibleLimit.value = 40
  enableResume.value = true
  selectedCreator.value = creator
  currentTab.value = ''
  isSearchMode.value = false
  isTrendingMode.value = false
  isFavoriteVideosMode.value = false
  isHistoryMode.value = false
  isPlaylistMode.value = false
  isMusicMode.value = false
  isAlgorithmMode.value = false
  searchQuery.value = '' 
  activeFilterQuery.value = ''
  if (window.innerWidth < 960) drawer.value = false
  scrollToTop(mainScrollRef.value)

  if (API_KEYS.length > 0) {
    fetchChannelVideosParallel([creator])
  }
}

const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    // 백그라운드 복귀 시
  } 
}

const handleTimePaste = (event) => {
  const pastedText = (event.clipboardData || window.clipboardData).getData('text').trim()
  
  if (pastedText.includes(':')) {
    event.preventDefault() 
    
    const parts = pastedText.split(':').map(val => parseInt(val, 10) || 0)
    
    if (parts.length === 3) {
      jumpMinutes.value = (parts[0] * 60) + parts[1]
      jumpSeconds.value = parts[2]
    } else if (parts.length === 2) {
      jumpMinutes.value = parts[0]
      jumpSeconds.value = parts[1]
    }
  }
}

onMounted(async () => {
  loadFavoriteVideoResumeStates()
  await getActiveApiKeyIndex()
  await loadDataFromDB()
  
  if (creators.value.length > 0) {
    fetchChannelVideosParallel(creators.value)
  }

  // ⚡ 앱 마운트 시점에 YouTube 플레이어 미리 생성 (Pre-init)
  initPreloadedYouTubePlayer()

  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('scroll', checkMainScroll, { passive: true })
  window.addEventListener('popstate', handlePopState)
  window.addEventListener('resize', handlePlayerViewportResize)
  window.visualViewport?.addEventListener('resize', handlePlayerViewportResize)
  window.visualViewport?.addEventListener('scroll', handlePlayerViewportResize)
})

onUnmounted(() => {
  stopHistoryTracker()
  clearSleepTimer()
  stopPlayerPointerInteraction()
  window.removeEventListener('scroll', checkMainScroll)
  window.removeEventListener('popstate', handlePopState)
  window.removeEventListener('resize', handlePlayerViewportResize)
  window.visualViewport?.removeEventListener('resize', handlePlayerViewportResize)
  window.visualViewport?.removeEventListener('scroll', handlePlayerViewportResize)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

const getHeaderTitle = computed(() => {
  if (selectedCreator.value) return selectedCreator.value.name
  if (isAlgorithmMode.value) return '알고리즘 추천 피드'
  if (isFavoriteVideosMode.value) return '즐겨찾기 영상'
  if (isHistoryMode.value) return '시청 기록'
  if (isPlaylistMode.value) {
    if (activePlaylistId.value) {
      const pl = playlists.value.find(p => p.id === activePlaylistId.value)
      return pl ? `재생 목록: ${pl.name}` : '재생 목록'
    }
    return `재생 목록 (${getCurrentGroupName()})`
  }
  if (isSearchMode.value) return '유튜브 검색'
  if (isTrendingMode.value) return '실시간 급상승 영상'
  if (isMusicMode.value) return '유튜브 음악 탭'
  if (currentTab.value === 'discoverAll') return '전체 구독 피드'
  return '구독 피드 모음 (하트 크리에이터)'
})

const allFilteredVideos = computed(() => {
  let result = videos.value

  if (isAlgorithmMode.value) {
    result = algorithmVideos.value
  } else if (isMusicMode.value) {
    result = musicVideos.value
  } else if (isTrendingMode.value) {
    result = trendingVideos.value
  } else if (isSearchMode.value) {
    result = searchResultVideos.value
  } else if (selectedCreator.value) {
    result = result.filter(v => v.creatorId === selectedCreator.value.id)
  } else if (isFavoriteVideosMode.value) {
    result = result.filter(v => v.isFavorite)
  } else if (isHistoryMode.value) {
    const historyMap = new Map(historyList.value.map(h => [h.videoId, h.updatedAt]))
    result = result.filter(v => historyMap.has(v.id))
    result.sort((a, b) => new Date(historyMap.get(b.id) || '') - new Date(historyMap.get(a.id) || ''))
  } else if (isPlaylistMode.value && activePlaylistId.value) {
    const itemsInPlaylist = playlistItems.value.filter(item => item.playlistId === activePlaylistId.value)
    const orderedVideos = []
    itemsInPlaylist.forEach(item => {
      const v = result.find(video => video.id === item.videoId)
      if (v && !orderedVideos.some(ov => ov.id === v.id)) orderedVideos.push(v)
    })
    result = orderedVideos
  } else if (currentTab.value === 'discoverAll') {
    const subscribedIds = creators.value.map(c => c.id)
    result = result.filter(v => subscribedIds.includes(v.creatorId))
  } else if (currentTab.value === 'discoverHeart') {
    const favoriteCreators = creators.value.filter(c => c.isFavorite)
    const targetCreatorIds = favoriteCreators.length > 0 
      ? favoriteCreators.map(c => c.id) 
      : creators.value.map(c => c.id)

    result = result.filter(v => targetCreatorIds.includes(v.creatorId))
  }

  if (activeFilterQuery.value.trim() && !isSearchMode.value && !isMusicMode.value) {
    const query = activeFilterQuery.value.trim().toLowerCase()
    result = result.filter(v => v.title.toLowerCase().includes(query) || v.creatorName.toLowerCase().includes(query))
  }

  if (!isPlaylistMode.value && !isTrendingMode.value && !isMusicMode.value && !isHistoryMode.value && !isAlgorithmMode.value) {
    result.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))
  }

  return result
})

const displayedVideos = computed(() => {
  return allFilteredVideos.value.slice(0, visibleLimit.value)
})

const isAllSelected = computed({
  get() {
    if (displayedVideos.value.length === 0) return false
    return displayedVideos.value.every(v => selectedVideoIds.value.includes(v.id))
  },
  set(val) {
    selectedVideoIds.value = val ? displayedVideos.value.map(v => v.id) : []
  }
})

const isIndeterminate = computed(() => {
  if (displayedVideos.value.length === 0) return false
  const selectedCount = displayedVideos.value.filter(v => selectedVideoIds.value.includes(v.id)).length
  return selectedCount > 0 && selectedCount < displayedVideos.value.length
})

const toggleSelectAll = () => {}

const relatedVideos = computed(() => {
  if (!activeVideo.value) return []
  const current = activeVideo.value
  const sameChannelVideos = videos.value.filter(v => v.id !== current.id && v.creatorId === current.creatorId)
  const otherChannelVideos = videos.value.filter(v => v.id !== current.id && v.creatorId !== current.creatorId)
  return [...sameChannelVideos, ...otherChannelVideos].slice(0, 15)
})

const shortsVideos = computed(() => displayedVideos.value.filter(v => v.isShorts))
const normalVideos = computed(() => displayedVideos.value.filter(v => !v.isShorts))
</script>

<style>
html, body {
  overflow-x: hidden !important;
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  background-color: #06070a;
}

.neon-youtube-app {
  background-color: #06070a !important;
  font-family: 'Inter', sans-serif;
  color: #ffffff;
  position: relative;
  overflow-x: hidden !important;
  width: 100%;
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}

.max-container-width {
  max-width: 1600px !important;
  margin: 0 auto;
}

.bg-blob {
  position: absolute;
  width: 450px;
  height: 450px;
  border-radius: 50%;
  filter: blur(100px);
  z-index: 0;
  opacity: 0.12;
  pointer-events: none;
}
.blob-1 { top: -150px; left: -150px; background: #7928ca; }
.blob-2 { bottom: -150px; right: -150px; background: #0070f3; }

.glass-app-bar, .glass-sidebar, .glass-card, .glass-banner, .glass-chip, .glass-modal, .bg-glass-bar {
  background: rgba(255, 255, 255, 0.035) !important;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
}

.text-accent { color: #a78bfa !important; }
.icon-tab-group { background: rgba(0, 0, 0, 0.45) !important; border: 1px solid rgba(255, 255, 255, 0.1) !important; }
.search-bar { max-width: 100%; }
.search-bar .v-field { border-radius: 32px !important; background: rgba(0, 0, 0, 0.35) !important; color: white !important; font-size: 14px !important; }

.video-checkbox-wrapper { position: absolute; top: 8px; right: 8px; z-index: 4; }
.bg-dark-glass { background: rgba(0, 0, 0, 0.65) !important; backdrop-filter: blur(6px); border: 1px solid rgba(255, 255, 255, 0.2); }
.jump-box-container { background: rgba(0, 0, 0, 0.55) !important; border: 1px solid rgba(255, 255, 255, 0.1) !important; }

.custom-jump-input { width: 42px !important; }
.custom-jump-input .v-field { background: rgba(0, 0, 0, 0.6) !important; border-radius: 8px !important; color: white !important; height: 30px !important; padding: 0 2px !important; }
.custom-jump-input .v-field__input { padding: 0 !important; min-height: 30px !important; height: 30px !important; line-height: 30px !important; font-size: 12px !important; text-align: center !important; }

.custom-list-item { border-radius: 14px !important; margin-bottom: 6px; transition: all 0.3s ease; }
.custom-list-item:hover { background: rgba(255, 255, 255, 0.08) !important; }
.neon-active { background: linear-gradient(135deg, rgba(121, 40, 202, 0.45), rgba(0, 112, 243, 0.45)) !important; border: 1px solid rgba(167, 139, 250, 0.35) !important; }

.glass-card { 
  transition: transform 0.3s cubic-bezier(0.1, 0.7, 0.1, 1), box-shadow 0.3s ease; 
  cursor: pointer;
  will-change: transform;
  transform: translateZ(0);
}
.glass-card:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(121, 40, 202, 0.25) !important; border-color: rgba(167, 139, 250, 0.45) !important; }

.playlist-list-item { transition: background 0.2s ease; cursor: pointer; }
.playlist-list-item:hover { background: rgba(255, 255, 255, 0.08) !important; }
.video-duration-badge-small { position: absolute; bottom: 4px; right: 4px; background: rgba(0, 0, 0, 0.85); color: #fff; padding: 2px 5px; border-radius: 4px; font-size: 10px; font-weight: bold; z-index: 2; }

.video-thumbnail-wrapper {
  position: relative;
  background: #000;
  aspect-ratio: 16 / 9;
  width: 100%;
  overflow: hidden;
}

.video-thumb-img {
  height: 100% !important;
  width: 100% !important;
}

.shorts-horizontal-scroll { display: flex; gap: 14px; overflow-x: auto; padding-bottom: 12px; scrollbar-width: thin; scrollbar-color: rgba(255, 255, 255, 0.25) transparent; }
.shorts-horizontal-scroll::-webkit-scrollbar { height: 6px; }
.shorts-horizontal-scroll::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.25); border-radius: 4px; }

.shorts-card { width: 140px; min-width: 140px; }
@media (min-width: 600px) { .shorts-card { width: 180px; min-width: 180px; } }

.shorts-badge { position: absolute; top: 8px; left: 8px; background: rgba(255, 0, 0, 0.85); color: white; padding: 2px 6px; border-radius: 6px; font-size: 10px; font-weight: bold; }
.video-progress-bar-container { position: absolute; bottom: 0; left: 0; right: 0; height: 5px; background-color: rgba(255, 255, 255, 0.3); z-index: 3; }
.video-progress-bar-fill { height: 100%; background-color: #ff0000; transition: width 0.3s ease; }

.play-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.45); display: flex; justify-content: center; align-items: center; opacity: 0; transition: opacity 0.3s ease; }
.video-thumbnail-wrapper:hover .play-overlay, .shorts-thumbnail-wrapper:hover .play-overlay { opacity: 1; }

.video-duration-badge-left { position: absolute; bottom: 8px; left: 8px; background: rgba(0, 0, 0, 0.85); color: #fff; padding: 2px 6px; border-radius: 6px; font-size: 12px; font-weight: bold; z-index: 2; letter-spacing: 0.5px; }
/* 재생 중에도 본문 목록을 조작할 수 있도록 플레이어를 상단 고정 도킹 형태로 표시 */
.safe-player-dialog {
  pointer-events: none !important;
  margin: 0 !important;
  max-height: none !important;
}
.safe-player-dialog .v-overlay__content {
  position: fixed !important;
  top: env(safe-area-inset-top, 0px) !important;
  left: 0 !important;
  right: 0 !important;
  margin: 0 auto !important;
  transform: none !important;
  width: min(880px, 100vw) !important;
  max-width: 880px !important;
  pointer-events: none !important;
}
.safe-player-dialog .glass-modal { pointer-events: auto !important; position: relative !important; isolation: isolate; }
/* 일부 모바일 브라우저에서 YouTube iframe의 GPU 레이어가 제목/버튼 위로 겹치는 현상 방지 */
.safe-player-dialog .mobile-tight-header { position: relative !important; z-index: 30 !important; isolation: isolate; }
.safe-player-dialog .modal-vertical-container { position: relative; z-index: 1; }
.safe-player-dialog .video-container { position: relative; z-index: 1; }
.safe-player-dialog .youtube-iframe { z-index: 0; }
.safe-player-dialog .floating-resize-handle { z-index: 2; }
.safe-player-dialog .player-compact-mode {
  border-radius: 0 0 14px 14px !important;
  box-shadow: 0 10px 28px rgba(0, 0, 0, .48) !important;
}
.safe-player-dialog .player-compact-mode .modal-vertical-container {
  max-height: none !important;
  overflow: visible !important;
}
.safe-player-dialog .player-compact-mode .modal-vertical-container > :not(.video-container):not(.radio-placeholder-card) {
  display: none !important;
}
.safe-player-dialog .player-floating-mode {
  box-sizing: border-box !important;
  border-radius: 12px !important;
  box-shadow: 0 16px 42px rgba(0, 0, 0, .72) !important;
  overflow: visible !important;
  max-height: calc(100vh - 16px) !important;
  max-height: calc(100dvh - 16px) !important;
  overflow: hidden !important;
}
@supports (height: 100dvh) {
  .safe-player-dialog .player-floating-mode { max-height: calc(100dvh - 16px) !important; }
}
.mobile-tight-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  row-gap: 3px;
}
.player-drag-handle {
  min-width: 0;
  flex: 1 1 180px;
  user-select: none;
  -webkit-user-select: none;
}
.player-header-actions {
  display: flex;
  flex: 0 1 auto;
  flex-wrap: wrap;
  justify-content: flex-end;
  min-width: 0;
  max-width: 100%;
  gap: 0;
}
.player-header-actions .v-btn { flex: 0 0 auto; }
.player-drag-handle.is-draggable { cursor: move; touch-action: none; }
.player-floating-mode .mobile-tight-header { border-radius: 12px 12px 0 0; min-height: 44px; }
/* 좁은 플로팅 플레이어에서는 제목과 아이콘을 자동으로 여러 줄에 배치 */
.player-floating-mode { container-type: inline-size; }
.player-floating-mode .player-floating-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  row-gap: 2px;
}
.player-floating-mode .player-drag-handle {
  flex: 1 1 120px;
  min-width: 0;
}
.player-floating-mode .player-header-actions {
  display: flex;
  flex: 0 1 auto;
  flex-wrap: wrap;
  justify-content: flex-end;
  min-width: 0;
  max-width: 100%;
  gap: 0;
}
.player-floating-mode .player-header-actions .v-btn { flex: 0 0 auto; }
@container (max-width: 420px) {
  .player-floating-mode .player-floating-header { justify-content: flex-start !important; }
  .player-floating-mode .player-drag-handle {
    flex: 1 1 100%;
    width: 100%;
    max-width: 100%;
  }
  .player-floating-mode .player-header-actions {
    flex: 1 1 100%;
    width: 100%;
    max-width: 100%;
    justify-content: flex-end;
  }
}
.player-floating-mode .video-container { min-height: 0; z-index: 1; }
.player-floating-mode .player-floating-header { flex-shrink: 0; background: rgba(24, 24, 32, .98); }
.player-floating-mode .youtube-iframe { z-index: 0; }
.floating-resize-handle {
  position: absolute;
  right: 0;
  bottom: 0;
  z-index: 20;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: rgba(20, 20, 28, .82);
  border-radius: 10px 0 0 0;
  cursor: nwse-resize;
  touch-action: none;
  box-shadow: 0 0 0 1px rgba(255,255,255,.22);
}
.floating-resize-handle:active { background: rgba(124, 58, 237, .95); }
.main-content.player-dock-active {
  padding-top: calc(min(56.25vw, 495px) + 48px) !important;
}
@media (max-width: 600px) {
  .safe-player-dialog .v-overlay__content { width: 100vw !important; max-width: 100vw !important; }
  .safe-player-dialog .player-compact-mode { border-radius: 0 0 12px 12px !important; }
  .safe-player-dialog .player-floating-mode { border-radius: 12px !important; }
  .main-content.player-dock-active { padding-top: calc(56.25vw + 44px) !important; }
}

/* 모바일 브라우저의 기본 당겨서 새로고침 동작을 허용합니다. */
html, body {
  max-height: 100%;
  overflow: hidden !important;
}
#app, .v-application {
  height: 100%;
  min-height: 0;
  overflow: hidden !important;
}
.main-content {
  overflow-y: auto !important;
  height: calc(100vh - 68px);
  height: calc(100dvh - 68px);
  /* 내부 스크롤에서 제스처를 처리해 브라우저 기본 새로고침과 충돌하지 않게 합니다. */
  overscroll-behavior-y: contain !important;
  overscroll-behavior: contain !important;
  touch-action: pan-x pan-y;
}
/* 모든 탭/목록의 마지막 항목이 브라우저 하단 고정 도구 모음에 가려지지 않도록 공통 여백 */
.main-content-container {
  padding-bottom: calc(100px + env(safe-area-inset-bottom, 0px)) !important;
}
.loading-overlay-container { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(6px); z-index: 2000; display: flex; justify-content: center; align-items: center; }
.loading-card { border: 1px solid rgba(167, 139, 250, 0.35) !important; box-shadow: 0 15px 35px rgba(0, 0, 0, 0.85) !important; min-width: 240px; text-align: center; }

.modal-vertical-container { max-height: calc(88vh - 40px); overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(255, 255, 255, 0.25) transparent; }
.modal-vertical-container::-webkit-scrollbar { width: 8px; }
.modal-vertical-container::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.25); border-radius: 4px; }

.video-container {
  position: relative;
  isolation: isolate;
  width: 100%;
  aspect-ratio: 16 / 9;
  min-height: 180px;
  background: #000000;
  overflow: hidden;
  flex-shrink: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
  will-change: aspect-ratio;
  transition: aspect-ratio 0.2s ease-in-out;
}
.video-container.audio-only-hidden { height: 0 !important; min-height: 0 !important; aspect-ratio: unset !important; opacity: 0; pointer-events: none; }

/* 라디오 모드도 영상 모드와 동일한 16:9 영역을 유지해 플레이어 높이가 튀지 않게 합니다. */
.radio-placeholder-card {
  background: rgba(121, 40, 202, 0.18);
  border-bottom: 1px solid rgba(167, 139, 250, 0.35);
  box-sizing: border-box !important;
  display: flex !important;
  flex: 0 0 auto !important;
  width: 100% !important;
  height: min(56.25vw, 495px) !important;
  min-height: 0 !important;
  max-height: 495px !important;
  aspect-ratio: auto !important;
  padding: clamp(12px, 3vw, 24px) !important;
  line-height: normal !important;
  overflow: hidden !important;
}
.safe-player-dialog .player-compact-mode .radio-placeholder-card,
.safe-player-dialog .glass-modal .radio-placeholder-card {
  display: flex !important;
  flex: 0 0 auto !important;
  width: 100% !important;
  height: min(56.25vw, 495px) !important;
  min-height: 0 !important;
  max-height: 495px !important;
  aspect-ratio: auto !important;
  box-sizing: border-box !important;
  line-height: normal !important;
}
.pulse-icon { animation: pulse 2s infinite; }
@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.18); opacity: 0.75; }
  100% { transform: scale(1); opacity: 1; }
}

.youtube-iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
  backface-visibility: hidden;
  transform: translateZ(0);
}

.comments-scroll-area { max-height: 480px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(255, 255, 255, 0.25) transparent; padding-right: 16px; }
.related-scroll-area-long { max-height: 260px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(255, 255, 255, 0.25) transparent; padding-right: 16px; }

.comments-scroll-area::-webkit-scrollbar, .related-scroll-area-long::-webkit-scrollbar { width: 6px; }
.comments-scroll-area::-webkit-scrollbar-thumb, .related-scroll-area-long::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.25); border-radius: 4px; }

.main-scroll-top-fab {
  position: fixed !important; 
  bottom: 85px !important;    
  right: 24px !important;     
  z-index: 99999 !important;     
  pointer-events: auto !important;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.8) !important; 
}

.mobile-tight-header { min-height: 42px !important; }
.border-top-glass { border-top: 1px solid rgba(255, 255, 255, 0.08); background: rgba(0, 0, 0, 0.2); }
.border-bottom-glass { border-bottom: 1px solid rgba(255, 255, 255, 0.06); }
.border-left-glass { border-left: 2px solid rgba(167, 139, 250, 0.35); }

.related-video-item, .comment-item { transition: background 0.2s ease; }
.related-video-item:hover { background: rgba(255, 255, 255, 0.08); }

.text-truncate-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.play-btn-circle { width: 56px; height: 56px; border-radius: 50%; background: rgba(167, 139, 250, 1); display: flex; justify-content: center; align-items: center; box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6); transition: transform 0.2s ease, background-color 0.2s ease; }
.play-btn-circle:hover { transform: scale(1.12); background: #7c3aed; }
.shorts-play-btn { width: 44px; height: 44px; }

.comment-text-content a { color: #a78bfa !important; text-decoration: underline !important; font-weight: 500; }
.creator-author-badge { background: rgba(167, 139, 250, 0.28); color: #c4b5fd !important; padding: 2px 8px; border-radius: 12px; border: 1px solid rgba(167, 139, 250, 0.4); }
.creator-name-link { cursor: pointer; text-decoration: underline; text-underline-offset: 2px; }
.creator-name-link:hover { color: #a78bfa !important; }
.v-checkbox .v-selection-control__label,
.v-selection-control__wrapper + .v-label {
  font-size: 13.5px !important;
  font-weight: 400 !important;
  color: #ffffff !important;
}
.app-message-card { border: 1px solid rgba(167, 139, 250, 0.35); box-shadow: 0 18px 60px rgba(0, 0, 0, 0.55); }
.app-message-text { white-space: pre-line; line-height: 1.65; overflow-wrap: anywhere; }


/* 모바일 Chrome/Brave 공통 플레이어 레이아웃 보정: 제목/버튼 겹침과 영상 아래 빈 공간 제거 */
.safe-player-dialog .glass-modal.player-compact-mode {
  display: flex !important;
  flex-direction: column !important;
  align-items: stretch !important;
  justify-content: flex-start !important;
  height: auto !important;
  min-height: 0 !important;
  padding: 0 !important;
  gap: 0 !important;
  overflow: hidden !important;
}
.safe-player-dialog .player-compact-mode > .mobile-tight-header {
  position: relative !important;
  inset: auto !important;
  display: flex !important;
  flex: 0 0 auto !important;
  width: 100% !important;
  min-height: 44px !important;
  margin: 0 !important;
  box-sizing: border-box !important;
  z-index: 50 !important;
  transform: none !important;
  background: rgba(24, 24, 32, .98) !important;
}
.safe-player-dialog .player-compact-mode .modal-vertical-container {
  position: relative !important;
  display: block !important;
  flex: 0 0 auto !important;
  width: 100% !important;
  height: auto !important;
  min-height: 0 !important;
  max-height: none !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
  line-height: 0 !important;
  transform: none !important;
}
.safe-player-dialog .player-compact-mode .video-container {
  position: relative !important;
  display: block !important;
  flex: 0 0 auto !important;
  width: 100% !important;
  height: auto !important;
  min-height: 0 !important;
  max-height: none !important;
  aspect-ratio: 16 / 9 !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
  transform: none !important;
  transition: none !important;
  line-height: 0 !important;
}
.safe-player-dialog .player-compact-mode #youtube-player-div,
.safe-player-dialog .player-compact-mode #youtube-player-div iframe,
.safe-player-dialog .player-compact-mode .youtube-iframe {
  position: absolute !important;
  inset: 0 !important;
  display: block !important;
  width: 100% !important;
  height: 100% !important;
  min-width: 0 !important;
  min-height: 0 !important;
  max-width: none !important;
  max-height: none !important;
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
}
.safe-player-dialog .player-compact-mode .radio-placeholder-card {
  flex: 0 0 auto !important;
  margin: 0 !important;
}
.safe-player-dialog .player-floating-mode {
  height: auto !important;
  min-height: 0 !important;
  max-height: calc(100vh - 16px) !important;
  max-height: calc(100dvh - 16px) !important;
  overflow: hidden !important;
}
.safe-player-dialog .player-floating-mode .player-floating-header,
.safe-player-dialog .player-floating-mode .player-header-actions {
  position: relative !important;
  z-index: 51 !important;
}
@media (max-width: 600px) {
  .safe-player-dialog .v-overlay__content {
    left: 0 !important;
    right: auto !important;
    margin: 0 !important;
    width: 100vw !important;
    max-width: 100vw !important;
  }
  .safe-player-dialog .player-compact-mode .video-container {
    width: 100% !important;
    aspect-ratio: 16 / 9 !important;
    min-height: 0 !important;
  }
}


/* FINAL FIX: full/detail mode and compact mode share the same stable mobile layout.
   Keep the header (including wrapped action buttons) in normal flow above the video. */
.safe-player-dialog .glass-modal {
  box-sizing: border-box !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: stretch !important;
  justify-content: flex-start !important;
  gap: 0 !important;
  min-height: 0 !important;
  padding: 0 !important;
}
.safe-player-dialog .glass-modal > .mobile-tight-header {
  position: relative !important;
  inset: auto !important;
  display: flex !important;
  flex: 0 0 auto !important;
  flex-wrap: wrap !important;
  align-content: flex-start !important;
  align-items: center !important;
  width: 100% !important;
  height: auto !important;
  min-height: 44px !important;
  margin: 0 !important;
  padding: 8px 12px !important;
  box-sizing: border-box !important;
  overflow: visible !important;
  isolation: isolate !important;
  z-index: 100 !important;
  transform: none !important;
  background: rgba(24, 24, 32, .98) !important;
  line-height: normal !important;
}
.safe-player-dialog .glass-modal > .mobile-tight-header .player-drag-handle {
  flex: 1 1 180px !important;
  min-width: 0 !important;
  max-width: 100% !important;
  overflow: hidden !important;
}
.safe-player-dialog .glass-modal > .mobile-tight-header .player-header-actions {
  display: flex !important;
  flex: 0 1 auto !important;
  flex-wrap: wrap !important;
  align-items: center !important;
  justify-content: flex-end !important;
  min-width: 0 !important;
  max-width: 100% !important;
  position: relative !important;
  isolation: isolate !important;
  z-index: 101 !important;
}
.safe-player-dialog .glass-modal > .modal-vertical-container {
  position: relative !important;
  display: block !important;
  flex: 0 1 auto !important;
  width: 100% !important;
  height: auto !important;
  min-height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  box-sizing: border-box !important;
  overflow-x: hidden !important;
  overflow-y: auto !important;
  line-height: normal !important;
  transform: none !important;
}
.safe-player-dialog .glass-modal .video-container {
  position: relative !important;
  display: block !important;
  flex: 0 0 auto !important;
  width: 100% !important;
  height: auto !important;
  min-width: 0 !important;
  min-height: 0 !important;
  max-height: none !important;
  aspect-ratio: 16 / 9 !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
  isolation: isolate !important;
  transform: none !important;
  transition: none !important;
  line-height: 0 !important;
  background: #000 !important;
}
.safe-player-dialog .glass-modal #youtube-player-div,
.safe-player-dialog .glass-modal #youtube-player-div iframe,
.safe-player-dialog .glass-modal .youtube-iframe {
  position: absolute !important;
  inset: 0 !important;
  display: block !important;
  width: 100% !important;
  height: 100% !important;
  min-width: 0 !important;
  min-height: 0 !important;
  max-width: none !important;
  max-height: none !important;
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
  z-index: 0 !important;
}
.safe-player-dialog .glass-modal .floating-resize-handle {
  position: absolute !important;
  z-index: 10 !important;
}
@media (max-width: 600px) {
  .safe-player-dialog .v-overlay__content {
    left: 0 !important;
    right: auto !important;
    width: 100vw !important;
    max-width: 100vw !important;
    margin: 0 !important;
  }
  .safe-player-dialog .glass-modal > .mobile-tight-header {
    justify-content: flex-start !important;
    row-gap: 4px !important;
    padding: 8px 12px !important;
  }
  .safe-player-dialog .glass-modal > .mobile-tight-header .player-drag-handle {
    flex: 1 1 100% !important;
    width: 100% !important;
    max-width: 100% !important;
  }
  .safe-player-dialog .glass-modal > .mobile-tight-header .player-header-actions {
    flex: 1 1 100% !important;
    width: 100% !important;
    max-width: 100% !important;
    justify-content: flex-end !important;
  }
  .safe-player-dialog .glass-modal .video-container {
    width: 100% !important;
    aspect-ratio: 16 / 9 !important;
    min-height: 0 !important;
  }
  .safe-player-dialog .glass-modal:not(.player-compact-mode) .modal-vertical-container {
    max-height: calc(100vh - 150px) !important;
    max-height: calc(100dvh - 150px) !important;
  }
}


/* Final override: radio placeholder must occupy exactly one video-sized 16:9 slot.
   Avoid vw-based fixed heights and flex stretching on mobile browsers. */
.safe-player-dialog .glass-modal .modal-vertical-container > .radio-placeholder-card,
.safe-player-dialog .player-compact-mode .modal-vertical-container > .radio-placeholder-card {
  display: flex !important;
  position: relative !important;
  box-sizing: border-box !important;
  flex: 0 0 auto !important;
  align-self: stretch !important;
  width: 100% !important;
  height: auto !important;
  min-height: 0 !important;
  max-height: none !important;
  aspect-ratio: 16 / 9 !important;
  padding: clamp(12px, 3vw, 24px) !important;
  margin: 0 !important;
  overflow: hidden !important;
}
.safe-player-dialog .glass-modal .modal-vertical-container > .video-container.audio-only-hidden {
  display: none !important;
  width: 100% !important;
  height: 0 !important;
  min-height: 0 !important;
  max-height: 0 !important;
  aspect-ratio: auto !important;
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
}



/* Dual fullscreen support:
   - YouTube's own fullscreen control remains enabled (playerVars.fs=1).
   - This separate app fullscreen mode expands the app player to the visible viewport. */
.safe-player-dialog.app-player-fullscreen-active {
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  height: 100dvh !important;
  max-width: none !important;
  max-height: none !important;
  margin: 0 !important;
  padding: 0 !important;
  z-index: 3000 !important;
}
.safe-player-dialog.app-player-fullscreen-active .v-overlay__scrim {
  display: none !important;
}
.safe-player-dialog.app-player-fullscreen-active .v-overlay__content {
  position: fixed !important;
  inset: 0 !important;
  display: flex !important;
  align-items: stretch !important;
  justify-content: stretch !important;
  width: 100vw !important;
  height: 100vh !important;
  height: 100dvh !important;
  max-width: none !important;
  max-height: none !important;
  margin: 0 !important;
  padding: 0 !important;
  transform: none !important;
  pointer-events: auto !important;
  overflow: hidden !important;
}
.safe-player-dialog .glass-modal.app-player-fullscreen-mode {
  display: flex !important;
  flex-direction: column !important;
  width: 100vw !important;
  height: 100vh !important;
  height: 100dvh !important;
  max-width: none !important;
  max-height: none !important;
  min-height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
  overflow: hidden !important;
  background: #000 !important;
  box-shadow: none !important;
}
.safe-player-dialog .app-player-fullscreen-mode > .mobile-tight-header {
  flex: 0 0 auto !important;
  min-height: 44px !important;
  padding-top: max(6px, env(safe-area-inset-top, 0px)) !important;
  padding-left: max(8px, env(safe-area-inset-left, 0px)) !important;
  padding-right: max(8px, env(safe-area-inset-right, 0px)) !important;
  background: rgba(18, 18, 24, .98) !important;
}
.safe-player-dialog .app-player-fullscreen-mode .modal-vertical-container {
  display: flex !important;
  flex: 1 1 auto !important;
  flex-direction: column !important;
  width: 100% !important;
  height: auto !important;
  min-height: 0 !important;
  max-height: none !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
  background: #000 !important;
}
.safe-player-dialog .app-player-fullscreen-mode .modal-vertical-container > :not(.video-container):not(.radio-placeholder-card) {
  display: none !important;
}
.safe-player-dialog .app-player-fullscreen-mode .video-container {
  position: relative !important;
  display: block !important;
  flex: 1 1 auto !important;
  width: 100% !important;
  height: 100% !important;
  min-height: 0 !important;
  max-height: none !important;
  aspect-ratio: auto !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
  background: #000 !important;
}
.safe-player-dialog .app-player-fullscreen-mode #youtube-player-div,
.safe-player-dialog .app-player-fullscreen-mode #youtube-player-div iframe,
.safe-player-dialog .app-player-fullscreen-mode .youtube-iframe {
  position: absolute !important;
  inset: 0 !important;
  display: block !important;
  width: 100% !important;
  height: 100% !important;
  min-width: 0 !important;
  min-height: 0 !important;
  max-width: none !important;
  max-height: none !important;
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
}
.safe-player-dialog .app-player-fullscreen-mode .radio-placeholder-card {
  flex: 1 1 auto !important;
  width: 100% !important;
  min-height: 0 !important;
  height: auto !important;
  margin: 0 !important;
  border-radius: 0 !important;
}
@supports (height: 100dvh) {
  .safe-player-dialog.app-player-fullscreen-active,
  .safe-player-dialog.app-player-fullscreen-active .v-overlay__content,
  .safe-player-dialog .glass-modal.app-player-fullscreen-mode {
    height: 100dvh !important;
  }
}
@media (orientation: landscape) {
  .safe-player-dialog .app-player-fullscreen-mode > .mobile-tight-header {
    min-height: 40px !important;
    padding-top: max(3px, env(safe-area-inset-top, 0px)) !important;
    padding-bottom: 3px !important;
  }
}


/* Android/iOS 공통: 세로 상태에서 자체 전체화면 플레이어를 가로 화면처럼 표시 */
@media (orientation: portrait) {
  .safe-player-dialog.app-landscape-emulated.app-player-fullscreen-active .v-overlay__content {
    inset: auto !important;
    top: 50% !important;
    left: 50% !important;
    right: auto !important;
    bottom: auto !important;
    width: 100vh !important;
    height: 100vw !important;
    transform: translate(-50%, -50%) rotate(90deg) !important;
    transform-origin: center center !important;
    overflow: hidden !important;
  }
  .safe-player-dialog.app-landscape-emulated .glass-modal.app-player-fullscreen-mode {
    width: 100% !important;
    height: 100% !important;
    min-width: 0 !important;
    min-height: 0 !important;
  }
}
@supports (height: 100dvh) {
  @media (orientation: portrait) {
    .safe-player-dialog.app-landscape-emulated.app-player-fullscreen-active .v-overlay__content {
      width: 100dvh !important;
      height: 100vw !important;
    }
  }
}


/* 자체 가로모드에서는 종료 버튼 하나만 영상 위에 플로팅 */
.safe-player-dialog .app-fullscreen-exit-button {
  position: absolute !important;
  top: max(12px, env(safe-area-inset-top, 0px)) !important;
  right: max(12px, env(safe-area-inset-right, 0px)) !important;
  z-index: 10050 !important;
  width: 44px !important;
  height: 44px !important;
  min-width: 44px !important;
  border-radius: 50% !important;
  background: rgba(20, 20, 24, .62) !important;
  color: #fff !important;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 2px 12px rgba(0, 0, 0, .35) !important;
}
.safe-player-dialog .app-fullscreen-exit-button .v-icon {
  font-size: 25px !important;
}

</style>