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
    <v-app-bar flat class="glass-app-bar px-1 px-md-4" height="64">
      <v-app-bar-nav-icon @click="drawer = !drawer" class="text-white" density="compact"></v-app-bar-nav-icon>
      
      <div class="d-flex align-center ml-0 mr-2 gap-1 flex-shrink-0">
        <v-icon icon="mdi-play-box-multiple" class="text-accent" size="26"></v-icon>
        <span class="text-accent text-caption font-weight-bold ml-1" title="현재 사용 중인 YouTube API 키 번호">#{{ currentApiKeyNumber }}</span>
      </div>
      
      <v-text-field
        v-model="searchQuery"
        density="compact"
        variant="outlined"
        :placeholder="selectedCreator ? `${selectedCreator.name} 내 검색...` : (isMusicMode ? '음악/아티스트 검색...' : (isTrendingMode ? '인기 급상승 영상 (검색어 무시)...' : (isSearchMode ? '유튜브 전체 검색어를 입력하세요...' : (isHistoryMode ? '시청 기록 내 검색...' : (isFavoriteVideosMode ? '즐겨찾기 영상 내 검색...' : (isPlaylistMode ? '재생 목록 내 검색...' : '구독 전체 피드 내 검색...'))))))"
        prepend-inner-icon="mdi-magnify"
        class="search-bar flex-grow-1"
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
              title="조회/검색 실행"
              @click.stop="triggerTabSearchOrUpdate"
            >
              <v-icon icon="mdi-cloud-search"></v-icon>
            </v-btn>
          </div>
        </template>
      </v-text-field>

      <template v-slot:extension>
        <div class="d-flex align-center px-4 py-1 w-100 overflow-x-auto glass-extension-bar">
          <div class="d-flex align-center gap-1 icon-tab-group pa-1 rounded-xl flex-nowrap w-100 justify-start justify-md-center">
            <v-btn
              icon="mdi-play-box-multiple-outline"
              size="small"
              variant="flat"
              :color="currentTab === 'discoverAll' && !selectedCreator ? 'deep-purple-darken-2' : 'transparent'"
              class="text-white flex-shrink-0"
              title="구독 전체 피드"
              @click="selectDiscoverAll"
            ></v-btn>
            <v-btn
              icon="mdi-heart-outline"
              size="small"
              variant="flat"
              :color="currentTab === 'discoverHeart' && !selectedCreator ? 'deep-purple-darken-2' : 'transparent'"
              class="text-white flex-shrink-0"
              title="구독 피드 모음"
              @click="selectDiscoverHeart"
            ></v-btn>
            <v-btn
              icon="mdi-heart-multiple"
              size="small"
              variant="flat"
              :color="isFavoriteVideosMode ? 'deep-purple-darken-2' : 'transparent'"
              class="text-white flex-shrink-0"
              title="즐겨찾기 영상"
              @click="enableFavoriteVideosMode"
            ></v-btn>
            <v-btn
              icon="mdi-playlist-music"
              size="small"
              variant="flat"
              :color="isPlaylistMode ? 'deep-purple-darken-2' : 'transparent'"
              class="text-white flex-shrink-0"
              title="재생 목록"
              @click="enablePlaylistMode"
            ></v-btn>
            <v-btn
              icon="mdi-history"
              size="small"
              variant="flat"
              :color="isHistoryMode ? 'deep-purple-darken-2' : 'transparent'"
              class="text-white flex-shrink-0"
              title="시청 기록"
              @click="enableHistoryMode"
            ></v-btn>
            <v-btn
              icon="mdi-magnify"
              size="small"
              variant="flat"
              :color="isSearchMode ? 'deep-purple-darken-2' : 'transparent'"
              class="text-white flex-shrink-0"
              title="유튜브 전체 검색"
              @click="enableSearchMode"
            ></v-btn>
            <v-btn
              icon="mdi-fire"
              size="small"
              variant="flat"
              :color="isTrendingMode ? 'deep-purple-darken-2' : 'transparent'"
              class="text-white flex-shrink-0"
              title="실시간 급상승 영상"
              @click="enableTrendingMode"
            ></v-btn>
            <v-btn
              icon="mdi-music-box-outline"
              size="small"
              variant="flat"
              :color="isMusicMode ? 'deep-purple-darken-2' : 'transparent'"
              class="text-white flex-shrink-0"
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
      width="280"
    >
      <v-list density="compact" nav class="text-white">
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
          title="구독 피드 모음" 
          value="discoverHeart" 
          class="mb-2 custom-list-item"
          :class="{ 'neon-active': currentTab === 'discoverHeart' && !selectedCreator }"
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
        
        <div class="px-4 d-flex align-center justify-space-between mb-2">
          <span class="text-subtitle-2 text-grey-lighten-1">구독 크리에이터</span>
          <div class="d-flex align-center gap-1">
            <v-btn icon="mdi-download" size="x-small" variant="text" color="accent" title="구독 목록 백업 (내려받기)" @click="downloadCreatorsBackup"></v-btn>
            <v-btn icon="mdi-upload" size="x-small" variant="text" color="accent" title="구독 목록 불러오기 (올리기)" @click="triggerUploadCreators"></v-btn>
          </div>
        </div>
        
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
    <v-main ref="mainScrollRef" class="main-content position-relative" @scroll="checkMainScroll">
      <v-container fluid class="pa-2 pa-md-6">
        
        <!-- 타이틀 영역 -->
        <v-card class="glass-banner mb-3 mb-md-6 pa-3 pa-md-4 rounded-xl position-relative overflow-hidden">
          <div class="banner-glow"></div>
          <div style="z-index: 2; position: relative;" class="d-flex align-center justify-space-between gap-3">
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
              <h1 class="text-subtitle-1 text-md-h5 font-weight-black text-white ma-0">
                {{ getHeaderTitle }} <span v-if="selectedVideoIds.length > 0" class="text-accent text-subtitle-2">({{ selectedVideoIds.length }}개 선택됨)</span>
              </h1>
            </div>
          </div>
        </v-card>

        <!-- 음악 탭 전용 UI -->
        <div v-if="isMusicMode">
          <div class="d-flex align-center gap-2 overflow-x-auto pb-3 mb-4">
            <v-chip
              v-for="cat in musicCategories"
              :key="cat.value"
              :color="musicCategory === cat.value ? 'deep-purple-darken-2' : 'default'"
              class="text-white font-weight-bold glass-chip flex-shrink-0 cursor-pointer"
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
                class="text-white font-weight-bold"
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
              <p class="text-caption text-grey-darken-1 mt-1">상단 검색창에 가수나 곡명을 입력하여 검색해 보세요.</p>
            </v-col>
          </v-row>

          <div v-else class="d-flex flex-column gap-2">
            <v-card
              v-for="(video) in displayedVideos"
              :key="video.id"
              class="glass-card rounded-xl pa-2 d-flex align-center justify-space-between position-relative playlist-list-item"
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

                <div class="playlist-thumb-wrapper position-relative bg-black rounded-lg overflow-hidden flex-shrink-0">
                  <v-img :src="video.thumbnail" width="96" height="54" cover>
                    <div v-if="video.duration > 0" class="video-duration-badge-small">{{ formatVideoDuration(video.duration) }}</div>
                  </v-img>
                </div>

                <div class="overflow-hidden flex-grow-1">
                  <h3 class="text-white font-weight-bold text-caption text-md-subtitle-2 text-truncate mb-1" v-html="video.title"></h3>
                  <p class="text-grey-lighten-1 text-caption mb-0 text-truncate">{{ video.creatorName }}</p>
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

        <!-- 재생 목록 폴더 목록 뷰 -->
        <div v-else-if="isPlaylistMode && !activePlaylistId">
          <div class="d-flex justify-space-between align-center mb-4">
            <div class="d-flex align-center gap-2">
              <h2 class="text-subtitle-1 text-md-h6 font-weight-bold text-white ma-0">내 재생 목록 폴더</h2>
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
              class="text-white font-weight-bold"
              @click="openCreatePlaylistDialog"
            >
              새 폴더 만들기
            </v-btn>
          </div>

          <v-row v-if="playlists.length === 0" justify="center" align="center" style="min-height: 200px;">
            <v-col cols="12" class="text-center">
              <v-icon icon="mdi-folder-outline" size="56" class="text-grey-darken-2 mb-2"></v-icon>
              <h3 class="text-subtitle-1 text-grey-lighten-1 font-weight-bold">생성된 재생 목록 폴더가 없습니다</h3>
              <p class="text-caption text-grey-darken-1 mt-1">상단의 '새 폴더 만들기' 버튼을 눌러 재생 목록을 만들어 보세요.</p>
            </v-col>
          </v-row>

          <v-row v-else dense>
            <v-col v-for="(playlist, index) in playlists" :key="playlist.id" cols="12" sm="6" md="4" lg="3">
              <v-card 
                class="glass-card rounded-xl pa-4 h-100 d-flex flex-column justify-space-between position-relative" 
                elevation="0"
                @click="selectPlaylistFolder(playlist)"
              >
                <div>
                  <div class="d-flex justify-space-between align-start mb-2">
                    <v-icon icon="mdi-folder-music" color="accent" size="36"></v-icon>
                    <div class="d-flex align-center gap-1" @click.stop>
                      <v-btn icon="mdi-tray-arrow-down" size="x-small" variant="text" color="accent" title="이 폴더 개별 백업" @click="downloadSinglePlaylistBackup(playlist)"></v-btn>
                      <v-btn icon="mdi-tray-arrow-up" size="x-small" variant="text" color="accent" title="이 폴더로 개별 불러오기" @click="triggerUploadSinglePlaylist(playlist)"></v-btn>
                      <v-btn
                        icon="mdi-arrow-up"
                        size="x-small"
                        variant="text"
                        color="white"
                        :disabled="index === 0"
                        title="위로 이동"
                        @click="movePlaylistOrder(index, -1)"
                      ></v-btn>
                      <v-btn
                        icon="mdi-arrow-down"
                        size="x-small"
                        variant="text"
                        color="white"
                        :disabled="index === playlists.length - 1"
                        title="아래로 이동"
                        @click="movePlaylistOrder(index, 1)"
                      ></v-btn>
                      <v-btn
                        icon="mdi-pencil"
                        size="x-small"
                        variant="text"
                        color="accent"
                        title="폴더 이름 수정"
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
                <div class="d-flex justify-end mt-4">
                  <v-btn
                    size="small"
                    variant="flat"
                    color="deep-purple-darken-2"
                    class="text-white font-weight-bold"
                    @click.stop="playPlaylistFolder(playlist)"
                    :disabled="getPlaylistVideoCount(playlist.id) === 0"
                  >
                    전체 재생
                  </v-btn>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </div>

        <!-- 재생 목록 폴더 안의 영상 뷰 -->
        <template v-else-if="isPlaylistMode && activePlaylistId">
          <div class="mb-3 d-flex align-center justify-space-between flex-wrap gap-2">
            <v-btn
              variant="text"
              color="accent"
              size="small"
              prepend-icon="mdi-arrow-left"
              @click="activePlaylistId = null"
            >
              재생 목록 폴더 목록으로 돌아가기
            </v-btn>

            <v-btn
              color="deep-purple-darken-2"
              variant="flat"
              size="small"
              prepend-icon="mdi-play"
              class="text-white font-weight-bold"
              :disabled="displayedVideos.length === 0"
              @click="playPlaylistFolder({ id: activePlaylistId })"
            >
              재생 목록 전체 재생
            </v-btn>
          </div>

          <v-row v-if="displayedVideos.length === 0" justify="center" align="center" style="min-height: 250px;">
            <v-col cols="12" class="text-center">
              <v-icon icon="mdi-play-box-outline" size="56" class="text-grey-darken-2 mb-2"></v-icon>
              <h3 class="text-subtitle-1 text-grey-lighten-1 font-weight-bold">이 재생 목록에 담긴 영상이 없습니다</h3>
            </v-col>
          </v-row>

          <div v-else class="d-flex flex-column gap-2">
            <v-card
              v-for="(video, index) in displayedVideos"
              :key="video.id"
              class="glass-card rounded-xl pa-2 d-flex align-center justify-space-between position-relative playlist-list-item"
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

                <div class="playlist-thumb-wrapper position-relative bg-black rounded-lg overflow-hidden flex-shrink-0">
                  <v-img :src="video.thumbnail" width="96" height="54" cover>
                    <div v-if="video.duration > 0" class="video-duration-badge-small">{{ formatVideoDuration(video.duration) }}</div>
                  </v-img>
                </div>

                <div class="overflow-hidden flex-grow-1">
                  <h3 class="text-white font-weight-bold text-caption text-md-subtitle-2 text-truncate mb-1" v-html="video.title"></h3>
                  <p class="text-grey-lighten-1 text-caption mb-0 text-truncate">{{ video.creatorName }}</p>
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
                {{ isSearchMode ? '검색된 결과가 없습니다. 상단 바에 검색어를 입력하고 검색해 보세요.' : (isHistoryMode ? '시청한 기록이 없습니다. 영상을 시청해 보세요.' : (isFavoriteVideosMode ? '즐겨찾기(좋아요)한 영상이 없습니다.' : (isTrendingMode ? '실시간 급상승 영상을 불러오지 못했습니다.' : '구독 중인 채널의 새로운 영상이 없습니다.'))) }}
              </p>
            </v-col>
          </v-row>

          <template v-else>
            <!-- 시청 기록 탭 전용 리스트 뷰 -->
            <div v-if="isHistoryMode" class="d-flex flex-column gap-2">
              <v-card
                v-for="video in displayedVideos"
                :key="video.id"
                class="glass-card rounded-xl pa-2 d-flex align-center justify-space-between position-relative playlist-list-item"
                elevation="0"
                @click="playVideo(video)"
              >
                <div class="d-flex align-center gap-3 overflow-hidden flex-grow-1 pr-2">
                  <div class="playlist-thumb-wrapper position-relative bg-black rounded-lg overflow-hidden flex-shrink-0">
                    <v-img :src="video.thumbnail" width="96" height="54" cover>
                      <div v-if="video.duration > 0" class="video-duration-badge-small">{{ formatVideoDuration(video.duration) }}</div>
                      <div v-if="video.progressPercent > 0" class="video-progress-bar-container">
                        <div class="video-progress-bar-fill" :style="{ width: video.progressPercent + '%' }"></div>
                      </div>
                    </v-img>
                  </div>
                  <div class="overflow-hidden flex-grow-1">
                    <h3 class="text-white font-weight-bold text-caption text-md-subtitle-2 text-truncate mb-1" v-html="video.title"></h3>
                    <div class="d-flex align-center gap-2">
                      <p class="text-grey-lighten-1 text-caption mb-0 text-truncate">{{ video.creatorName }}</p>
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
              <div v-if="shortsVideos.length > 0" class="mb-4">
                <div class="d-flex align-center mb-2">
                  <v-icon icon="mdi-lightning-bolt" color="red" class="mr-2" size="20"></v-icon>
                  <h2 class="text-subtitle-2 text-md-h6 font-weight-bold text-white ma-0">Shorts</h2>
                </div>
                <div class="shorts-horizontal-scroll">
                  <div 
                    v-for="video in shortsVideos" 
                    :key="video.id" 
                    class="shorts-card glass-card rounded-xl overflow-hidden d-flex flex-column flex-shrink-0 position-relative"
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
                      <v-img :src="video.thumbnail" height="200" contain class="align-end">
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
                    <div class="pa-2 d-flex flex-column justify-space-between flex-grow-1">
                      <h3 class="text-white font-weight-bold text-caption text-truncate-2" v-html="video.title"></h3>
                      <div class="d-flex justify-space-between align-center mt-1">
                        <p class="text-grey-lighten-1 text-caption mb-0 text-truncate">{{ video.creatorName }}</p>
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
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="normalVideos.length > 0">
                <div v-if="shortsVideos.length > 0" class="d-flex align-center mb-2">
                  <v-icon icon="mdi-youtube" color="red" class="mr-2" size="20"></v-icon>
                  <h2 class="text-subtitle-2 text-md-h6 font-weight-bold text-white ma-0">동영상</h2>
                </div>
                <v-row dense>
                  <v-col v-for="video in normalVideos" :key="video.id" cols="12" sm="6" md="4" lg="3">
                    <v-card class="glass-card rounded-xl overflow-hidden h-100 d-flex flex-column mb-2 mb-sm-0 position-relative" elevation="0" @click="playVideo(video)">
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

                      <div class="video-thumbnail-wrapper position-relative bg-black">
                        <v-img :src="video.thumbnail" class="video-thumb-img align-end" contain>
                          <div v-if="video.duration > 0" class="video-duration-badge-left">{{ formatVideoDuration(video.duration) }}</div>
                          <div v-if="video.progressPercent > 0" class="video-progress-bar-container">
                            <div class="video-progress-bar-fill" :style="{ width: video.progressPercent + '%' }"></div>
                          </div>
                        </v-img>
                        <div class="play-overlay">
                          <div class="play-btn-circle shorts-play-btn">
                            <v-icon icon="mdi-play" color="white" size="24"></v-icon>
                          </div>
                        </div>
                      </div>

                      <v-card-text class="flex-grow-1 d-flex flex-column justify-space-between pa-2 pa-md-3">
                        <div class="d-flex justify-space-between align-start gap-2">
                          <div class="flex-grow-1 overflow-hidden">
                            <h3 class="text-white font-weight-bold text-caption text-md-subtitle-1 mb-1 text-truncate-2" v-html="video.title"></h3>
                            <p class="text-grey-lighten-1 text-caption mb-0 text-truncate">{{ video.creatorName }}</p>
                          </div>
                          <div class="d-flex flex-column align-end flex-shrink-0 text-right" style="min-width: 85px;">
                            <span class="text-grey-darken-1 text-caption mb-1">{{ formatRelativeTime(video.publishedAt) }}</span>
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

      </v-container>

      <v-slide-y-transition>
        <v-btn
          v-if="showMainScrollTop"
          icon="mdi-chevron-up"
          size="small"
          color="deep-purple-darken-2"
          variant="flat"
          class="main-scroll-top-fab text-white"
          title="최상위로 이동"
          @click="scrollToTop(mainScrollRef)"
        >
          <v-icon icon="mdi-chevron-up" color="white" size="24"></v-icon>
        </v-btn>
      </v-slide-y-transition>
    </v-main>

    <!-- 로딩 오버레이 -->
    <div v-if="isLoading" class="loading-overlay-container">
      <div class="loading-card glass-modal pa-4 rounded-xl d-flex flex-column align-center shadow-lg">
        <v-progress-circular indeterminate color="accent" size="48" width="4" class="mb-3"></v-progress-circular>
        <h3 class="text-subtitle-1 text-white font-weight-bold mb-1">조회 중입니다...</h3>
        <p class="text-caption text-grey-lighten-1 mb-0">잠시만 기다려 주세요.</p>
      </div>
    </div>

    <!-- 재생 목록 생성/수정 다이얼로그 -->
    <v-dialog v-model="isPlaylistDialogVisible" max-width="400px">
      <v-card class="glass-modal rounded-xl pa-4 text-white">
        <h3 class="text-subtitle-1 font-weight-bold mb-3">{{ editingPlaylist ? '재생 목록 폴더 이름 수정' : '새 재생 목록 폴더 생성' }}</h3>
        <v-text-field
          v-model="playlistFormName"
          label="폴더 이름"
          variant="outlined"
          density="compact"
          class="mb-3"
          @keydown.enter="savePlaylistFolder"
        ></v-text-field>
        <div class="d-flex justify-end gap-2">
          <v-btn variant="text" color="grey-lighten-1" size="small" @click="isPlaylistDialogVisible = false">취소</v-btn>
          <v-btn color="deep-purple-darken-2" variant="flat" size="small" class="text-white font-weight-bold" @click="savePlaylistFolder">저장</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- 영상 -> 재생 목록에 저장 다이얼로그 -->
    <v-dialog v-model="isSaveToPlaylistDialogVisible" max-width="420px">
      <v-card class="glass-modal rounded-xl pa-4 text-white">
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
              class="text-white font-weight-bold flex-shrink-0"
              @click="quickCreateAndSelectPlaylist"
            >
              폴더 생성
            </v-btn>
          </div>
        </div>

        <div class="d-flex justify-end gap-2 mt-2">
          <v-btn variant="text" color="grey-lighten-1" size="small" @click="isSaveToPlaylistDialogVisible = false">취소</v-btn>
          <v-btn color="deep-purple-darken-2" variant="flat" size="small" class="text-white font-weight-bold" @click="confirmSaveToPlaylists">확인</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- 시네마틱 영상 재생 모달 -->
    <v-dialog v-model="isPlayerOpen" :max-width="isLandscapeMode ? '95vw' : '850px'" width="100%" scrim="black" class="safe-player-dialog" @update:model-value="onDialogModelUpdate">
      <v-card class="glass-modal rounded-xl overflow-hidden pa-0">
        <div class="d-flex justify-space-between align-center px-3 py-1 px-md-4 bg-glass-bar mobile-tight-header">
          <div class="d-flex align-center overflow-hidden pr-2">
            <span v-if="playlistQueue.length > 1" class="text-accent text-caption font-weight-bold mr-2 flex-shrink-0">
              [{{ playlistIndex + 1 }}/{{ playlistQueue.length }}]
            </span>
            <span class="text-white font-weight-bold text-caption text-md-subtitle-1 text-truncate">{{ activeVideo?.title }}</span>
          </div>
          <div class="d-flex align-center flex-shrink-0">
            <v-btn v-if="playlistQueue.length > 1" icon="mdi-skip-previous" variant="text" size="small" color="white" :disabled="playlistIndex <= 0" @click="playPreviousInQueue"></v-btn>
            <v-btn v-if="playlistQueue.length > 1" icon="mdi-skip-next" variant="text" size="small" color="white" :disabled="playlistIndex >= playlistQueue.length - 1" @click="playNextInQueue" class="mr-2"></v-btn>

            <!-- 취침 예약 기능 -->
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
              <v-list density="compact" class="glass-modal rounded-lg py-2 text-white" width="210">
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
                      placeholder="분 입력"
                      min="1"
                      @keydown.enter="setCustomSleepTimer"
                    ></v-text-field>
                    <span class="text-caption text-white mr-1">분</span>
                    <v-btn size="small" color="accent" variant="outlined" class="px-2" @click="setCustomSleepTimer">적용</v-btn>
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

            <!-- 라디오 모드 토글 버튼 (화면 숨김 / 오디오만 재생) -->
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

            <v-btn icon variant="text" size="small" color="accent" class="mr-2" @click="toggleLandscapeMode" title="화면 크기 변경">
              <v-icon :icon="isLandscapeMode ? 'mdi-crop-portrait' : 'mdi-crop-landscape'" size="20"></v-icon>
            </v-btn>
            <v-btn icon="mdi-close" variant="text" size="x-small" color="white" @click="closePlayer"></v-btn>
          </div>
        </div>

        <div ref="modalScrollRef" class="modal-vertical-container position-relative" @scroll="checkModalScroll">
          <!-- 비디오 영역 (라디오 모드일 경우 화면을 숨김) -->
          <div 
            class="video-container" 
            :class="{ 'landscape-expanded': isLandscapeMode, 'audio-only-hidden': isAudioOnlyMode }"
          >
            <div id="youtube-player-div" class="youtube-iframe"></div>
          </div>

          <!-- 라디오 모드 시 표시되는 비주얼 플레이어 카드 -->
          <div v-if="isAudioOnlyMode" class="radio-placeholder-card pa-6 text-center d-flex flex-column align-center justify-center">
            <v-icon icon="mdi-radio-tower" size="56" color="accent" class="pulse-icon mb-3"></v-icon>
            <h3 class="text-subtitle-1 font-weight-bold text-white mb-1">📻 라디오 전용 오디오 모드 재생 중</h3>
            <p class="text-caption text-grey-lighten-1 mb-0">영상은 숨겨지고 오디오만 연속 재생 중입니다.</p>
          </div>

          <div class="pa-3 pa-md-4 bg-glass-bar d-flex justify-space-between align-center flex-wrap gap-2 border-bottom-glass">
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
                  class="text-white font-weight-bold"
                >
                  유튜브에서 직접 보기
                </v-btn>
              </div>
              <div class="d-flex align-center gap-2 mt-1">
                <p class="text-grey-lighten-1 text-caption mb-0">{{ activeVideo?.creatorName }}</p>
                <div class="d-flex align-center gap-1">
                  <v-btn
                    size="x-small"
                    variant="outlined"
                    color="accent"
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
              <p v-if="initialWatchedTime > 5" class="text-accent text-caption mt-1 mb-0">
                ⚡ 이전 시청 기록({{ formatTime(initialWatchedTime) }})에서 이어서 재생됩니다.
              </p>
            </div>
            
            <div class="d-flex align-center jump-box-container pa-1 px-2 rounded-lg">
              <span class="text-caption text-grey-lighten-1 mr-1 flex-shrink-0">시간 제어:</span>
              <div class="d-flex align-center mr-1">
                <v-text-field v-model.number="jumpMinutes" type="number" density="compact" variant="outlined" hide-details class="custom-jump-input text-center mr-1" placeholder="0" min="0"></v-text-field>
                <span class="text-caption text-white">분</span>
              </div>
              <div class="d-flex align-center mr-2">
                <v-text-field v-model.number="jumpSeconds" type="number" density="compact" variant="outlined" hide-details class="custom-jump-input text-center mr-1" placeholder="0" min="0" max="59"></v-text-field>
                <span class="text-caption text-white">초</span>
              </div>
              <div class="d-flex align-center gap-1">
                <v-btn color="accent" variant="flat" size="small" class="px-2" @click="jumpToTime">이동</v-btn>
                <v-btn color="blue-grey-darken-2" variant="flat" size="small" class="px-2 font-weight-bold" @click="cumulativeJump(-1)">- 이전</v-btn>
                <v-btn color="amber-darken-2" variant="flat" size="small" class="px-2 font-weight-bold" @click="cumulativeJump(1)">+ 이후</v-btn>
              </div>
            </div>

            <div>
              <v-btn color="accent" variant="outlined" size="small" :prepend-icon="showComments ? 'mdi-comment-off-outline' : 'mdi-comment-multiple-outline'" @click="toggleCommentsView">
                {{ showComments ? '댓글 숨기기' : '댓글 보기' }}
              </v-btn>
            </div>
          </div>

          <div v-if="showComments" class="comments-section pa-3 border-bottom-glass position-relative">
            <div class="d-flex align-center justify-space-between flex-wrap gap-2 mb-3 pb-1 border-bottom-glass">
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
                    <v-btn v-bind="props" variant="text" size="small" class="text-none text-white font-weight-bold px-2" prepend-icon="mdi-sort-variant">정렬 기준</v-btn>
                  </template>
                  <v-list density="compact" class="glass-modal rounded-lg py-1">
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
                <div class="comment-item mb-3 pb-2 border-bottom-glass">
                  <div class="d-flex align-start">
                    <v-avatar :size="32" class="mr-3 mt-1 flex-shrink-0">
                      <v-img :src="comment.authorProfileImageUrl || 'https://cdn.vuetifyjs.com/images/lists/1.jpg'"></v-img>
                    </v-avatar>
                    <div class="flex-grow-1 overflow-hidden">
                      <div class="d-flex align-center flex-wrap gap-1 mb-1">
                        <span class="text-caption font-weight-bold mr-1" :class="comment.isOwner ? 'creator-author-badge' : 'text-white'">{{ comment.author }}</span>
                        <v-chip v-if="comment.isOwner" size="x-small" color="accent" variant="flat" class="px-1 py-0 font-weight-bold text-caption" style="height: 18px;">채널 작성자</v-chip>
                        <span class="text-grey-darken-1 text-caption ml-1">{{ comment.publishedAt }}</span>
                      </div>
                      <p class="text-grey-lighten-2 text-caption mb-1 comment-text-content" v-html="comment.text"></p>
                      
                      <div class="d-flex align-center gap-2 text-caption text-grey-darken-1">
                        <div class="d-flex align-center">
                          <v-icon icon="mdi-thumb-up-outline" size="14" class="mr-1"></v-icon>
                          <span>{{ comment.likeCount > 0 ? comment.likeCount : '' }}</span>
                        </div>

                        <v-btn
                          v-if="!showReplies && comment.replyCount > 0"
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

                  <div v-if="showReplies && comment.replyCount > 0" class="ml-8 mt-2 pl-3 border-left-glass">
                    <div v-for="reply in getRepliesForComment(comment.id)" :key="reply.id" class="comment-item mb-2 pb-1">
                      <div class="d-flex align-start">
                        <v-avatar :size="24" class="mr-2 mt-1 flex-shrink-0">
                          <v-img :src="reply.authorProfileImageUrl || 'https://cdn.vuetifyjs.com/images/lists/1.jpg'"></v-img>
                        </v-avatar>
                        <div class="flex-grow-1 overflow-hidden">
                          <div class="d-flex align-center flex-wrap gap-1 mb-1">
                            <span class="text-caption font-weight-bold mr-1" :class="reply.isOwner ? 'creator-author-badge' : 'text-white'">{{ reply.author }}</span>
                            <v-chip v-if="reply.isOwner" size="x-small" color="accent" variant="flat" class="px-1 py-0 font-weight-bold text-caption" style="height: 18px;">채널 작성자</v-chip>
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

              <div v-if="!showReplies && activeExpandedCommentId" class="mb-3 pl-6 border-left-glass">
                <div v-if="isLoadingReplies" class="text-center py-2">
                  <v-progress-circular indeterminate color="accent" size="18" width="2"></v-progress-circular>
                  <span class="text-grey-lighten-1 text-caption ml-2">답글 불러오는 중...</span>
                </div>
                <template v-else>
                  <div v-for="reply in getRepliesForComment(activeExpandedCommentId)" :key="reply.id" class="comment-item mb-2 pb-1">
                    <div class="d-flex align-start">
                      <v-avatar :size="24" class="mr-2 mt-1 flex-shrink-0">
                        <v-img :src="reply.authorProfileImageUrl || 'https://cdn.vuetifyjs.com/images/lists/1.jpg'"></v-img>
                      </v-avatar>
                      <div class="flex-grow-1 overflow-hidden">
                        <div class="d-flex align-center flex-wrap gap-1 mb-1">
                          <span class="text-caption font-weight-bold mr-1" :class="reply.isOwner ? 'creator-author-badge' : 'text-white'">{{ reply.author }}</span>
                          <v-chip v-if="reply.isOwner" size="x-small" color="accent" variant="flat" class="px-1 py-0 font-weight-bold text-caption" style="height: 18px;">채널 작성자</v-chip>
                          <span class="text-grey-darken-1 text-caption ml-1">{{ reply.publishedAt }}</span>
                        </div>
                        <p class="text-grey-lighten-2 text-caption mb-1 comment-text-content" v-html="reply.text"></p>
                      </div>
                    </div>
                  </div>
                </template>
              </div>

              <div v-if="isLoadingComments" class="text-center py-2">
                <v-progress-circular indeterminate color="accent" size="20" width="2"></v-progress-circular>
                <span class="text-grey-lighten-1 text-caption ml-2">댓글 더 불러오는 중...</span>
              </div>
            </div>
          </div>

          <div class="related-videos-section pa-3 position-relative">
            <div class="text-subtitle-2 font-weight-bold text-white mb-3 d-flex align-center">
              <v-icon icon="mdi-playlist-play" class="mr-1 text-accent" size="20"></v-icon>
              관련 영상 (비슷한 채널 및 추천)
            </div>
            <div v-if="relatedVideos.length === 0" class="text-grey-darken-1 text-caption text-center py-6">관련 영상이 없습니다.</div>
            <div ref="relatedScrollRef" class="related-scroll-area-long" @scroll="checkRelatedScroll">
              <div v-for="video in relatedVideos" :key="video.id" class="related-video-item d-flex align-center mb-2 pa-2 rounded-lg cursor-pointer" @click="playVideo(video)">
                <v-img :src="video.thumbnail" width="120" height="70" contain class="rounded-lg mr-3 flex-shrink-0 bg-black"></v-img>
                <div class="overflow-hidden flex-grow-1">
                  <h4 class="text-white text-caption font-weight-bold text-truncate-2 mb-1" v-html="video.title"></h4>
                  <p class="text-grey-darken-1 text-caption mb-0">{{ video.creatorName }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

const drawer = ref(false)
const searchQuery = ref('')
const lastSearchQuery = ref('') 
const selectedCreator = ref(null)
const currentTab = ref('discoverHeart')
const isSearchMode = ref(false)
const isTrendingMode = ref(false)
const isFavoriteVideosMode = ref(false)
const isHistoryMode = ref(false)
const isPlaylistMode = ref(false)
const isMusicMode = ref(false)
const isLoading = ref(false)

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
const historyList = ref([])

const musicCategory = ref('top')
const musicCategories = [
  { title: '인기 가요/팝', value: 'top' },
  { title: '발라드 믹스', value: 'ballad' },
  { title: '아이돌/댄스', value: 'dance' },
  { title: 'Lo-Fi / 힙합', value: 'lofi' },
  { title: '재즈 / 어쿠스틱', value: 'jazz' }
]

const playlists = ref([])
const playlistItems = ref([])
const activePlaylistId = ref(null)

const isPlaylistDialogVisible = ref(false)
const playlistFormName = ref('')
const editingPlaylist = ref(null)

const isSaveToPlaylistDialogVisible = ref(false)
const targetPlaylistIds = ref([])
const quickNewPlaylistName = ref('')

const selectedVideoIds = ref([])
const playlistQueue = ref([])
const playlistIndex = ref(0)

const channelNextPageTokens = ref(new Map())
const trendingNextPageToken = ref(null)

const isPlayerOpen = ref(false)
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
const isLandscapeMode = ref(false)
const isAudioOnlyMode = ref(false) 

const sleepTimerSecondsLeft = ref(0)
const customSleepMinutes = ref(null)
let sleepTimerInterval = null

let ytPlayer = null          
let historyInterval = null   
let currentPlayingTime = 0   

let isPopStateTriggered = false
const searchNextPageToken = ref(null)

const draggedIndex = ref(null)

const handlePopState = () => {
  if (isPlayerOpen.value) {
    isPopStateTriggered = true
    closePlayer()
  }
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

const checkMainScroll = (e) => {
  const target = e.target
  showMainScrollTop.value = target.scrollTop > 100

  const bottomReached = target.scrollTop + target.clientHeight >= target.scrollHeight - 100
  if (bottomReached && !isLoading.value) {
    if (isTrendingMode.value && trendingNextPageToken.value) {
      loadMoreTrendingVideos()
    } else if (isSearchMode.value && searchNextPageToken.value) {
      loadMoreSearchVideos()
    } else if (selectedCreator.value) {
      loadMoreChannelVideos(selectedCreator.value)
    }
  }
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
  let targetElement = el
  if (el && el.$el) targetElement = el.$el
  if (targetElement && typeof targetElement.scrollTo === 'function') {
    targetElement.scrollTo({ top: 0, behavior: 'smooth' })
  } else if (targetElement) {
    targetElement.scrollTop = 0
  }
}

const toggleLandscapeMode = () => {
  isLandscapeMode.value = !isLandscapeMode.value
}

const toggleAudioOnlyMode = () => {
  isAudioOnlyMode.value = !isAudioOnlyMode.value
}

const setSleepTimer = (minutes) => {
  clearSleepTimer()
  sleepTimerSecondsLeft.value = minutes * 60
  sleepTimerInterval = setInterval(() => {
    if (sleepTimerSecondsLeft.value > 0) {
      sleepTimerSecondsLeft.value--
    } else {
      clearSleepTimer()
      if (ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
        try { ytPlayer.pauseVideo() } catch (e) { console.debug(e) }
      }
      closePlayer()
    }
  }, 1000)
}

const setCustomSleepTimer = () => {
  const mins = Number(customSleepMinutes.value)
  if (!mins || mins <= 0) {
    alert('올바른 분(Minute)을 입력해 주세요.')
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

const DB_NAME = 'NeonTubeDB_Clean'
const DB_VERSION = 4

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

const parseISO8601Duration = (durationStr) => {
  if (!durationStr) return 0
  const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  return (parseInt(match[1] || 0, 10) * 3600) + (parseInt(match[2] || 0, 10) * 60) + parseInt(match[3] || 0, 10)
}

const fetchAndUpdateVideoDurations = async (videoList) => {
  if (!videoList || videoList.length === 0 || API_KEYS.length === 0) return videoList
  const targetVideos = videoList.filter(v => !v.duration || v.duration === 0)
  if (targetVideos.length === 0) return videoList

  const ids = targetVideos.map(v => v.youtubeId).slice(0, 50).join(',')
  try {
    const data = await fetchWithKeyRotation((key) => 
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${ids}&key=${key}`
    )
    if (data.items) {
      const durationMap = new Map()
      data.items.forEach(item => durationMap.set(item.id, parseISO8601Duration(item.contentDetails.duration)))
      videoList.forEach(v => {
        if (durationMap.has(v.youtubeId)) v.duration = durationMap.get(v.youtubeId)
      })
    }
  } catch (err) { console.error(err) }
  return videoList
}

// 공통: 누락된 영상 ID들을 유튜브 API로 조회하여 DB에 저장하는 헬퍼 함수
const fetchAndSaveMissingVideos = async (db, itemVideoIds) => {
  if (!itemVideoIds || itemVideoIds.length === 0 || API_KEYS.length === 0) return

  const existingVideosStore = await new Promise((resolve) => {
    db.transaction('videos', 'readonly').objectStore('videos').getAll().onsuccess = (ev) => resolve(ev.target.result || [])
  })
  const existingVideoIds = new Set(existingVideosStore.map(v => v.id))
  const missingIds = itemVideoIds.filter(id => !existingVideoIds.has(id))

  if (missingIds.length > 0) {
    for (let i = 0; i < missingIds.length; i += 50) {
      const chunk = missingIds.slice(i, i + 50).join(',')
      try {
        const data = await fetchWithKeyRotation((key) => 
          `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${chunk}&key=${key}`
        )
        if (data.items) {
          const videoTx = db.transaction('videos', 'readwrite')
          const videoStore = videoTx.objectStore('videos')

          data.items.forEach(item => {
            const snippet = item.snippet
            const videoId = item.id
            const title = snippet.title.toLowerCase()
            const thumbUrl = snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url
            const isShorts = title.includes('#shorts') || title.includes('shorts') || title.includes('#쇼츠')

            const parsed = {
              id: videoId,
              youtubeId: videoId,
              creatorId: snippet.channelId,
              creatorName: snippet.channelTitle,
              title: snippet.title,
              thumbnail: thumbUrl,
              isShorts: isShorts,
              isFavorite: false,
              views: snippet.publishedAt.substring(0, 10),
              publishedAt: snippet.publishedAt,
              duration: parseISO8601Duration(item.contentDetails?.duration),
              progressPercent: 0,
              currentTime: 0,
              historyUpdatedAt: null
            }
            videoStore.put(parsed)
            if (!videos.value.some(v => v.id === parsed.id)) {
              videos.value.push(parsed)
            }
          })
        }
      } catch (err) {
        console.error('누락된 영상 정보 조회 실패:', err)
      }
    }
  }
}

// 구독 백업 및 불러오기
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
        alert('올바르지 않은 구독 백업 파일 형식입니다.')
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
        alert(`구독 불러오기 완료! 새로운 크리에이터 ${addedCount}명이 추가되었습니다.`)
        if (addedCount > 0) {
          await fetchChannelVideosParallel(creators.value.filter(c => importedCreators.some(ic => ic.id === c.id)))
        }
      }
    } catch (err) {
      console.error(err)
      isLoading.value = false
      alert('파일을 읽는 중 오류가 발생했습니다.')
    } finally {
      event.target.value = ''
    }
  }
  reader.readAsText(file)
}

// 전체 재생 목록 백업 및 불러오기 (폴더가 없으면 자동 생성 기능 포함)
const downloadPlaylistsBackup = () => {
  const backupData = {
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

      // 1. 누락된 영상 정보 일괄 API 조회 및 DB 저장
      const allItemVideoIds = imported.playlistItems ? imported.playlistItems.map(i => i.videoId) : []
      await fetchAndSaveMissingVideos(db, allItemVideoIds)

      const tx = db.transaction(['playlists', 'playlistItems'], 'readwrite')
      
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
        alert(`전체 재생 목록 불러오기 완료! (${addedPlCount}개 새로운 폴더 추가됨)`)
      }
    } catch (err) {
      console.error(err)
      isLoading.value = false
      alert('재생 목록 파일을 읽는 중 오류가 발생했습니다.')
    } finally {
      event.target.value = ''
    }
  }
  reader.readAsText(file)
}

// 개별 재생 목록 백업 및 불러오기 (폴더가 없으면 자동 생성 및 성공 알림/재조회 보장)
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
        alert('올바르지 않은 개별 재생 목록 백업 파일 형식입니다.')
        return
      }

      const importedName = imported.playlist.name
      const db = await openDB()

      // 1. 백업된 videoId 목록 추출 및 누락된 영상 정보 API 자동 조회/저장
      const importedItemVideoIds = imported.items ? imported.items.map(i => i.videoId) : []
      await fetchAndSaveMissingVideos(db, importedItemVideoIds)

      // 2. 대상 폴더(targetUploadPlaylistObj)가 지정되지 않았거나 앱 내에 해당 이름의 폴더가 없는 경우 자동 생성
      let targetFolder = targetUploadPlaylistObj
      if (!targetFolder) {
        targetFolder = playlists.value.find(p => p.name === importedName)
      }

      if (!targetFolder) {
        // 폴더가 아예 없으므로 새로 생성
        const newPlId = 'pl_' + Date.now()
        const newPl = { id: newPlId, name: importedName, order: playlists.value.length }
        
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
          alert(`새로운 재생 목록 폴더 "${importedName}"이(가) 자동 생성되고 영상들이 정상적으로 불러와졌습니다!`)
        }
      } else {
        // 기존 폴더가 있으므로 항목 추가
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
          alert(`"${targetFolder.name}" 폴더에 영상 ${addedCount}개가 성공적으로 추가되었습니다!`)
        }
      }
    } catch (err) {
      console.error(err)
      isLoading.value = false
      alert('파일을 읽는 중 오류가 발생했습니다.')
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
        isLoading.value = false
        alert('음악 탭 데이터를 성공적으로 불러왔습니다.')
      } else {
        isLoading.value = false
      }
    } catch (err) {
      console.error(err)
      isLoading.value = false
      alert('음악 파일을 읽는 중 오류가 발생했습니다.')
    } finally {
      event.target.value = ''
    }
  }
  reader.readAsText(file)
}

const openCreatePlaylistDialog = () => {
  editingPlaylist.value = null
  playlistFormName.value = ''
  isPlaylistDialogVisible.value = true
}

const openEditPlaylistDialog = (playlist) => {
  editingPlaylist.value = playlist
  playlistFormName.value = playlist.name
  isPlaylistDialogVisible.value = true
}

const savePlaylistFolder = async () => {
  const name = playlistFormName.value.trim()
  if (!name) { alert('폴더 이름을 입력해 주세요.'); return }

  const isDuplicateName = playlists.value.some(p => p.name === name && p.id !== editingPlaylist.value?.id)
  if (isDuplicateName) {
    alert(`오류: 이미 동일한 이름("${name}")의 재생 목록 폴더가 존재합니다!`)
    return
  }

  const db = await openDB()
  const tx = db.transaction('playlists', 'readwrite')
  const store = tx.objectStore('playlists')

  if (editingPlaylist.value) {
    editingPlaylist.value.name = name
    store.put(editingPlaylist.value)
  } else {
    store.put({ id: 'pl_' + Date.now(), name: name, order: playlists.value.length })
  }

  tx.oncomplete = async () => {
    isPlaylistDialogVisible.value = false
    await loadDataFromDB()
  }
}

const quickCreateAndSelectPlaylist = async () => {
  const name = quickNewPlaylistName.value.trim()
  if (!name) { alert('새 폴더 이름을 입력해 주세요.'); return }

  const isDuplicateName = playlists.value.some(p => p.name === name)
  if (isDuplicateName) {
    alert(`오류: 이미 동일한 이름("${name}")의 재생 목록 폴더가 존재합니다!`)
    return
  }

  const newId = 'pl_' + Date.now()
  const db = await openDB()
  const tx = db.transaction('playlists', 'readwrite')
  tx.objectStore('playlists').put({ id: newId, name: name, order: playlists.value.length })

  tx.oncomplete = async () => {
    quickNewPlaylistName.value = ''
    await loadDataFromDB()
    if (!targetPlaylistIds.value.includes(newId)) targetPlaylistIds.value.push(newId)
  }
}

const deletePlaylist = async (playlist) => {
  if (!confirm(`'${playlist.name}' 재생 목록을 삭제하시겠습니까?`)) return
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
    await loadDataFromDB()
  }
}

const movePlaylistOrder = async (index, direction) => {
  const targetIndex = index + direction
  if (targetIndex < 0 || targetIndex >= playlists.value.length) return

  const temp = playlists.value[index]
  playlists.value[index] = playlists.value[targetIndex]
  playlists.value[targetIndex] = temp
  playlists.value.forEach((pl, idx) => pl.order = idx)

  const db = await openDB()
  const tx = db.transaction('playlists', 'readwrite')
  const store = tx.objectStore('playlists')
  playlists.value.forEach(pl => store.put(pl))
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
  const tx = db.transaction('playlistItems', 'readwrite')
  const store = tx.objectStore('playlistItems')

  selectedVideoIds.value.forEach(videoId => {
    targetPlaylistIds.value.forEach(playlistId => {
      if (!playlistItems.value.some(item => item.playlistId === playlistId && item.videoId === videoId)) {
        store.add({ playlistId, videoId })
      }
    })
  })

  tx.oncomplete = async () => {
    isSaveToPlaylistDialogVisible.value = false
    selectedVideoIds.value = []
    alert('선택한 영상이 재생 목록에 저장되었습니다.')
    await loadDataFromDB()
  }
}

const selectPlaylistFolder = (playlist) => { activePlaylistId.value = playlist.id }

const playPlaylistFolder = async (playlist) => {
  const itemVideoIds = playlistItems.value.filter(i => i.playlistId === playlist.id).map(i => i.videoId)
  const targetVideos = displayedVideos.value.filter(v => itemVideoIds.includes(v.id))
  if (targetVideos.length === 0) return

  playlistQueue.value = targetVideos
  playlistIndex.value = 0
  await startPlayingActiveVideo(targetVideos[0])
}

const playVideo = async (video) => {
  playlistQueue.value = [video]
  playlistIndex.value = 0
  await startPlayingActiveVideo(video)
}

const playSelectedVideos = async () => {
  if (selectedVideoIds.value.length === 0) return
  const selectedList = displayedVideos.value.filter(v => selectedVideoIds.value.includes(v.id))
  if (selectedList.length === 0) return

  playlistQueue.value = selectedList
  playlistIndex.value = 0
  selectedVideoIds.value = []
  await startPlayingActiveVideo(selectedList[0])
}

const playSelectedOrAllMusic = async () => {
  const targetList = selectedVideoIds.value.length > 0 
    ? displayedVideos.value.filter(v => selectedVideoIds.value.includes(v.id))
    : displayedVideos.value
  
  if (targetList.length === 0) return
  playlistQueue.value = targetList
  playlistIndex.value = 0
  selectedVideoIds.value = []
  await startPlayingActiveVideo(targetList[0])
}

const clearSelectedVideos = () => { selectedVideoIds.value = [] }

const startPlayingActiveVideo = async (video) => {
  activeVideo.value = video
  showComments.value = false
  activeExpandedCommentId.value = null
  comments.value = []
  commentsNextPageToken.value = null
  totalCommentCount.value = 0
  commentsOrder.value = 'relevance'
  initialWatchedTime.value = 0
  currentPlayingTime = 0
  jumpMinutes.value = 0
  jumpSeconds.value = 0
  isLandscapeMode.value = false

  isPopStateTriggered = false
  window.history.pushState({ playerOpen: true }, '')
  window.addEventListener('popstate', handlePopState)

  try {
    const db = await openDB()
    const watchedTime = await new Promise((resolve) => {
      const tx = db.transaction('history', 'readonly')
      const req = tx.objectStore('history').get(video.id)
      req.onsuccess = (e) => {
        const result = e.target.result
        resolve(result && result.currentTime ? Math.floor(result.currentTime) : 0)
      }
      req.onerror = () => resolve(0)
    })
    initialWatchedTime.value = watchedTime
    currentPlayingTime = watchedTime
  } catch (err) { console.error(err) }

  isPlayerOpen.value = true
  fetchComments(video.youtubeId)
  await nextTick()
  initYouTubePlayer(video.youtubeId, initialWatchedTime.value)
}

const playNextInQueue = async () => {
  if (playlistIndex.value < playlistQueue.value.length - 1) {
    playlistIndex.value++
    await startPlayingActiveVideo(playlistQueue.value[playlistIndex.value])
  }
}

const playPreviousInQueue = async () => {
  if (playlistIndex.value > 0) {
    playlistIndex.value--
    await startPlayingActiveVideo(playlistQueue.value[playlistIndex.value])
  }
}

const toggleCommentsView = () => {
  showComments.value = !showComments.value
  if (showComments.value && comments.value.length === 0 && activeVideo.value) {
    fetchComments(activeVideo.value.youtubeId)
  }
}

const closePlayer = () => {
  saveCurrentHistoryToDB()
  destroyYouTubePlayer()
  isPlayerOpen.value = false

  if (!isPopStateTriggered) window.history.back()
  isPopStateTriggered = false
  window.removeEventListener('popstate', handlePopState)
}

const onDialogModelUpdate = (val) => { if (!val) closePlayer() }

const initYouTubePlayer = (youtubeId, startTime) => {
  destroyYouTubePlayer()
  const startPos = startTime > 5 ? startTime : 0

  const createPlayerInstance = () => {
    if (!document.getElementById('youtube-player-div')) return
    ytPlayer = new window.YT.Player('youtube-player-div', {
      videoId: youtubeId,
      playerVars: { autoplay: 1, playsinline: 1, start: startPos },
      events: {
        onReady: (event) => {
          if (startPos > 0 && event.target) event.target.seekTo(startPos, true)
          startHistoryTracker()
        },
        onStateChange: async (event) => {
          if (event.data === 0) {
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
              playNextInQueue()
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
      document.getElementsByTagName('script')[0].parentNode.insertBefore(tag, document.getElementsByTagName('script')[0])
    }
    window.onYouTubeIframeAPIReady = () => createPlayerInstance()
  }
}

const destroyYouTubePlayer = () => {
  stopHistoryTracker()
  if (ytPlayer && typeof ytPlayer.destroy === 'function') {
    try { ytPlayer.destroy() } catch (e) { console.debug(e) }
  }
  ytPlayer = null
}

const startHistoryTracker = () => {
  stopHistoryTracker()
  historyInterval = setInterval(async () => {
    if (ytPlayer && typeof ytPlayer.getCurrentTime === 'function' && typeof ytPlayer.getDuration === 'function') {
      try {
        const t = ytPlayer.getCurrentTime()
        const dur = ytPlayer.getDuration()
        if (t && t > 0 && dur && dur > 0) {
          if (dur - t <= 5) {
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
  const dur = (ytPlayer && typeof ytPlayer.getDuration === 'function') ? ytPlayer.getDuration() : (activeVideo.value.duration || 0)

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
  if (ytPlayer && typeof ytPlayer.seekTo === 'function') ytPlayer.seekTo(totalSeconds, true)
}

const cumulativeJump = (direction) => {
  const stepSeconds = (Number(jumpMinutes.value) || 0) * 60 + (Number(jumpSeconds.value) || 0)
  if (stepSeconds <= 0) return

  let currentTime = currentPlayingTime
  if (ytPlayer && typeof ytPlayer.getCurrentTime === 'function') {
    try { currentTime = ytPlayer.getCurrentTime() } catch (e) { console.debug(e) }
  }

  const targetSeconds = Math.max(0, currentTime + (stepSeconds * direction))
  currentPlayingTime = targetSeconds
  saveCurrentHistoryToDB()
  if (ytPlayer && typeof ytPlayer.seekTo === 'function') ytPlayer.seekTo(targetSeconds, true)
}

const formatTime = (seconds) => `${Math.floor(seconds / 60)}분 ${seconds % 60}초`

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
    if (!comment.repliesLoaded && getRepliesForComment(comment.id).length === 0) {
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
    return { ...v, duration: videoDuration, currentTime, progressPercent: percent, historyUpdatedAt: h?.updatedAt || null }
  }).sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))

  playlists.value = (await new Promise((resolve) => {
    db.transaction('playlists', 'readonly').objectStore('playlists').getAll().onsuccess = (e) => resolve(e.target.result)
  }) || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  playlistItems.value = await new Promise((resolve) => {
    db.transaction('playlistItems', 'readonly').objectStore('playlistItems').getAll().onsuccess = (e) => resolve(e.target.result)
  }) || []
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
    if (!confirm(`'${targetCreator.name}' 채널 구독을 취소하시겠습니까?`)) return
    creators.value.splice(existingIndex, 1)
    db.transaction('creators', 'readwrite').objectStore('creators').delete(targetCreator.id)
    if (selectedCreator.value?.id === targetCreator.id) selectDiscoverHeart()
  } else {
    const newCreator = { 
      id: video.creatorId, 
      name: video.creatorName, 
      subCount: '구독중', 
      avatar: video.thumbnail || 'https://cdn.vuetifyjs.com/images/lists/1.jpg', 
      isFavorite: false 
    }
    creators.value.push(newCreator)
    db.transaction('creators', 'readwrite').objectStore('creators').put(newCreator)
    await fetchChannelVideosParallel([newCreator])
    alert(`'${newCreator.name}' 채널을 구독했습니다!`)
  }
}

const toggleSubscribeFromPlayer = async () => {
  if (!activeVideo.value) return
  await toggleSubscribeFromCard(activeVideo.value)
}

const unsubscribeCreator = async (creator) => {
  if (!confirm(`'${creator.name}' 채널 구독을 취소하시겠습니까?`)) return
  creators.value = creators.value.filter(c => c.id !== creator.id)
  const db = await openDB()
  db.transaction('creators', 'readwrite').objectStore('creators').delete(creator.id)
  if (selectedCreator.value?.id === creator.id) selectDiscoverHeart()
}

const fetchChannelVideosParallel = async (targetCreators) => {
  if (!targetCreators || targetCreators.length === 0 || API_KEYS.length === 0) return
  
  const promises = targetCreators.map(async (creator) => {
    try {
      const channelData = await fetchWithKeyRotation((key) => 
        `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${creator.id}&key=${key}`
      )
      if (channelData.error || !channelData.items || channelData.items.length === 0) return
      const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads

      const data = await fetchWithKeyRotation((key) => 
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=25&playlistId=${uploadsPlaylistId}&key=${key}`
      )

      if (!data.error && data.items) {
        if (data.nextPageToken) {
          channelNextPageTokens.value.set(creator.id, data.nextPageToken)
        }

        const db = await openDB()
        const existingMap = new Map(videos.value.map(v => [v.id, { isFavorite: v.isFavorite, progressPercent: v.progressPercent, currentTime: v.currentTime, duration: v.duration, historyUpdatedAt: v.historyUpdatedAt }]))

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
            title: snippet.title,
            thumbnail: thumbUrl,
            isShorts: isShorts,
            isFavorite: false,
            views: snippet.publishedAt.substring(0, 10),
            publishedAt: snippet.publishedAt,
            duration: 0,
            progressPercent: 0,
            currentTime: 0,
            historyUpdatedAt: null
          }

          if (existingMap.has(parsed.id)) {
            Object.assign(parsed, existingMap.get(parsed.id))
          }
          return parsed
        })

        await fetchAndUpdateVideoDurations(channelVideos)

        const tx = db.transaction('videos', 'readwrite')
        const store = tx.objectStore('videos')
        channelVideos.forEach(v => store.put(v))
        
        channelVideos.forEach(cv => {
          if (!videos.value.some(v => v.id === cv.id)) {
            videos.value.push(cv)
          }
        })
      }
    } catch (err) {
      console.error(`채널(${creator.name}) 영상 로드 실패:`, err)
    }
  })

  await Promise.all(promises)
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
      const isShorts = title.includes('#shorts') || title.includes('shorts') || title.includes('#쇼츠')

      const parsed = {
        id: videoId,
        youtubeId: videoId,
        creatorId: snippet.channelId,
        creatorName: snippet.channelTitle,
        title: snippet.title,
        thumbnail: thumbUrl,
        isShorts,
        isFavorite: existingMap.get(videoId) || false,
        views: snippet.publishedAt.substring(0, 10),
        publishedAt: snippet.publishedAt,
        duration: parseISO8601Duration(item.contentDetails?.duration),
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

const fetchMusicVideos = async (query = '인기 가요 믹스') => {
  if (API_KEYS.length === 0) return
  isLoading.value = true

  try {
    const data = await fetchWithKeyRotation((key) => 
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=25&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&key=${key}`
    )
    if (data.error || !data.items) return

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

      const parsed = {
        id: videoId,
        youtubeId: videoId,
        creatorId: snippet.channelId,
        creatorName: snippet.channelTitle,
        title: snippet.title,
        thumbnail: thumbUrl,
        isShorts: false,
        isFavorite: existingMap.get(videoId) || false,
        views: snippet.publishedAt.substring(0, 10),
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

    await fetchAndUpdateVideoDurations(parsedMusic)
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
      const isShorts = title.includes('#shorts') || title.includes('shorts') || title.includes('#쇼츠')

      const parsed = {
        id: videoId,
        youtubeId: videoId,
        creatorId: snippet.channelId,
        creatorName: snippet.channelTitle,
        title: snippet.title,
        thumbnail: thumbUrl,
        isShorts,
        isFavorite: existingMap.get(videoId) || false,
        views: snippet.publishedAt.substring(0, 10),
        publishedAt: snippet.publishedAt,
        duration: parseISO8601Duration(item.contentDetails?.duration),
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
  if (API_KEYS.length === 0 || !creator) return
  const pageToken = channelNextPageTokens.value.get(creator.id)
  if (!pageToken) return
  isLoading.value = true

  try {
    const channelData = await fetchWithKeyRotation((key) => 
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${creator.id}&key=${key}`
    )
    if (channelData.error || !channelData.items || channelData.items.length === 0) return
    const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads

    const data = await fetchWithKeyRotation((key) => 
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=25&playlistId=${uploadsPlaylistId}&pageToken=${pageToken}&key=${key}`
    )
    if (data.error || !data.items) return

    if (data.nextPageToken) channelNextPageTokens.value.set(creator.id, data.nextPageToken)
    else channelNextPageTokens.value.delete(creator.id)

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
        title: snippet.title,
        thumbnail: thumbUrl,
        isShorts,
        isFavorite: existingMap.get(videoId) || false,
        views: snippet.publishedAt.substring(0, 10),
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

    await fetchAndUpdateVideoDurations(moreVideos)
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

  if (isPlaylistMode.value || isHistoryMode.value) return

  isLoading.value = true
  try {
    if (isMusicMode.value) {
      await fetchMusicVideos(query || '인기 가요 믹스')
      return
    }

    if (isTrendingMode.value) {
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

    if (currentTab.value === 'discoverAll' && !selectedCreator.value) {
      if (!query && creators.value.length > 0) {
        await fetchChannelVideosParallel(creators.value)
        await loadDataFromDB()
      }
      return
    }

    if (currentTab.value === 'discoverHeart' && !selectedCreator.value) {
      const favoriteCreators = creators.value.filter(c => c.isFavorite)
      if (!query && favoriteCreators.length > 0) {
        await fetchChannelVideosParallel(favoriteCreators)
        await loadDataFromDB()
      }
      return
    }
  } finally {
    isLoading.value = false
  }
}

const handleSearch = async () => {
  if (isSearchMode.value || isMusicMode.value) {
    await triggerTabSearchOrUpdate()
  } else {
    triggerTabSearchOrUpdate()
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

    const parseSearchItem = (item) => {
      const title = item.snippet.title.toLowerCase()
      const thumbUrl = item.snippet.thumbnails.high ? item.snippet.thumbnails.high.url : item.snippet.thumbnails.default.url
      return {
        id: item.id.videoId,
        youtubeId: item.id.videoId,
        creatorId: item.snippet.channelId,
        creatorName: item.snippet.channelTitle,
        title: item.snippet.title,
        thumbnail: thumbUrl,
        isShorts: title.includes('#shorts') || title.includes('shorts') || title.includes('#쇼츠'),
        isFavorite: existingMap.get(item.id.videoId) || false,
        views: item.snippet.publishedAt.substring(0, 10),
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

    await fetchAndUpdateVideoDurations(apiVideos)
    
    apiVideos.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))
    searchResultVideos.value = apiVideos

    apiVideos.forEach(av => {
      if (!videos.value.some(v => v.id === av.id)) {
        videos.value.push(av)
      }
    })
    videos.value.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))

    const tx = db.transaction('videos', 'readwrite')
    const store = tx.objectStore('videos')
    apiVideos.forEach(v => store.put(v))
  } catch (error) { console.error(error) }
}

const loadMoreSearchVideos = async () => {
  if (!searchQuery.value.trim() || !searchNextPageToken.value || API_KEYS.length === 0) return
  isLoading.value = true
  try {
    const data = await fetchWithKeyRotation((key) => 
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(searchQuery.value.trim())}&type=video&pageToken=${searchNextPageToken.value}&key=${key}`
    )
    if (data.error || !data.items) return

    searchNextPageToken.value = data.nextPageToken || null
    const db = await openDB()
    const moreVideos = data.items.filter(item => item.id?.videoId).map(item => {
      const title = item.snippet.title.toLowerCase()
      const thumbUrl = item.snippet.thumbnails.high ? item.snippet.thumbnails.high.url : item.snippet.thumbnails.default.url
      return {
        id: item.id.videoId,
        youtubeId: item.id.videoId,
        creatorId: item.snippet.channelId,
        creatorName: item.snippet.channelTitle,
        title: item.snippet.title,
        thumbnail: thumbUrl,
        isShorts: title.includes('#shorts') || title.includes('shorts') || title.includes('#쇼츠'),
        isFavorite: false,
        views: item.snippet.publishedAt.substring(0, 10),
        publishedAt: item.snippet.publishedAt,
        duration: 0,
        progressPercent: 0,
        currentTime: 0,
        historyUpdatedAt: null
      }
    })
    await fetchAndUpdateVideoDurations(moreVideos)
    
    moreVideos.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))
    searchResultVideos.value.push(...moreVideos)
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
  } catch (error) { console.error(error) } finally { isLoading.value = false }
}

const selectDiscoverAll = async () => {
  isLoading.value = true
  selectedCreator.value = null
  currentTab.value = 'discoverAll'
  isSearchMode.value = false
  isTrendingMode.value = false
  isFavoriteVideosMode.value = false
  isHistoryMode.value = false
  isPlaylistMode.value = false
  isMusicMode.value = false
  searchQuery.value = '' 
  if (window.innerWidth < 960) drawer.value = false
  await new Promise(r => setTimeout(r, 200))
  isLoading.value = false
  scrollToTop(mainScrollRef.value)
}

const selectDiscoverHeart = async () => {
  isLoading.value = true
  selectedCreator.value = null
  currentTab.value = 'discoverHeart'
  isSearchMode.value = false
  isTrendingMode.value = false
  isFavoriteVideosMode.value = false
  isHistoryMode.value = false
  isPlaylistMode.value = false
  isMusicMode.value = false
  searchQuery.value = '' 
  if (window.innerWidth < 960) drawer.value = false
  await new Promise(r => setTimeout(r, 200))
  isLoading.value = false
  scrollToTop(mainScrollRef.value)
}

const enableTrendingMode = async () => {
  isLoading.value = true
  selectedCreator.value = null
  currentTab.value = ''
  isSearchMode.value = false
  isTrendingMode.value = true
  isFavoriteVideosMode.value = false
  isHistoryMode.value = false
  isPlaylistMode.value = false
  isMusicMode.value = false
  searchQuery.value = '' 
  if (window.innerWidth < 960) drawer.value = false
  await fetchTrendingVideos()
  scrollToTop(mainScrollRef.value)
}

const enableFavoriteVideosMode = async () => {
  isLoading.value = true
  selectedCreator.value = null
  currentTab.value = ''
  isSearchMode.value = false
  isTrendingMode.value = false
  isFavoriteVideosMode.value = true
  isHistoryMode.value = false
  isPlaylistMode.value = false
  isMusicMode.value = false
  searchQuery.value = '' 
  if (window.innerWidth < 960) drawer.value = false
  await new Promise(r => setTimeout(r, 200))
  isLoading.value = false
  scrollToTop(mainScrollRef.value)
}

const enableHistoryMode = async () => {
  isLoading.value = true
  selectedCreator.value = null
  currentTab.value = ''
  isSearchMode.value = false
  isTrendingMode.value = false
  isFavoriteVideosMode.value = false
  isHistoryMode.value = true
  isPlaylistMode.value = false
  isMusicMode.value = false
  searchQuery.value = '' 
  if (window.innerWidth < 960) drawer.value = false
  await new Promise(r => setTimeout(r, 200))
  isLoading.value = false
  scrollToTop(mainScrollRef.value)
}

const enablePlaylistMode = async () => {
  isLoading.value = true
  selectedCreator.value = null
  currentTab.value = ''
  isSearchMode.value = false
  isTrendingMode.value = false
  isFavoriteVideosMode.value = false
  isHistoryMode.value = false
  isPlaylistMode.value = true
  isMusicMode.value = false
  activePlaylistId.value = null
  searchQuery.value = '' 
  if (window.innerWidth < 960) drawer.value = false
  await new Promise(r => setTimeout(r, 200))
  isLoading.value = false
  scrollToTop(mainScrollRef.value)
}

const enableSearchMode = async () => {
  isLoading.value = true
  selectedCreator.value = null
  currentTab.value = ''
  isSearchMode.value = true
  isTrendingMode.value = false
  isFavoriteVideosMode.value = false
  isHistoryMode.value = false
  isPlaylistMode.value = false
  isMusicMode.value = false
  
  if (lastSearchQuery.value) {
    searchQuery.value = lastSearchQuery.value
  }

  if (window.innerWidth < 960) drawer.value = false
  await new Promise(r => setTimeout(r, 200))
  isLoading.value = false
  scrollToTop(mainScrollRef.value)
}

const enableMusicMode = async () => {
  isLoading.value = true
  selectedCreator.value = null
  currentTab.value = ''
  isSearchMode.value = false
  isTrendingMode.value = false
  isFavoriteVideosMode.value = false
  isHistoryMode.value = false
  isPlaylistMode.value = false
  isMusicMode.value = true
  searchQuery.value = '' 
  if (window.innerWidth < 960) drawer.value = false
  await fetchMusicVideos('인기 가요 믹스')
  scrollToTop(mainScrollRef.value)
}

const selectCreatorFilter = async (creator) => {
  isLoading.value = true
  selectedCreator.value = creator
  currentTab.value = ''
  isSearchMode.value = false
  isTrendingMode.value = false
  isFavoriteVideosMode.value = false
  isHistoryMode.value = false
  isPlaylistMode.value = false
  isMusicMode.value = false
  searchQuery.value = '' 
  if (window.innerWidth < 960) drawer.value = false
  await fetchChannelVideosParallel([creator])
  scrollToTop(mainScrollRef.value)
}

onMounted(async () => {
  await getActiveApiKeyIndex()
  await loadDataFromDB()
})

onUnmounted(() => {
  destroyYouTubePlayer()
  clearSleepTimer()
  window.removeEventListener('popstate', handlePopState)
})

const getHeaderTitle = computed(() => {
  if (selectedCreator.value) return selectedCreator.value.name
  if (isFavoriteVideosMode.value) return '즐겨찾기 영상'
  if (isHistoryMode.value) return '시청 기록'
  if (isPlaylistMode.value) {
    if (activePlaylistId.value) {
      const pl = playlists.value.find(p => p.id === activePlaylistId.value)
      return pl ? `재생 목록: ${pl.name}` : '재생 목록'
    }
    return '재생 목록'
  }
  if (isSearchMode.value) return '유튜브 검색'
  if (isTrendingMode.value) return '실시간 급상승 영상'
  if (isMusicMode.value) return '유튜브 음악 탭'
  if (currentTab.value === 'discoverAll') return '전체 구독 피드'
  return '구독 피드 모음'
})

const displayedVideos = computed(() => {
  let result = videos.value

  if (isMusicMode.value) {
    result = musicVideos.value
  } else if (isTrendingMode.value) {
    return trendingVideos.value
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
    return result
  } else if (isPlaylistMode.value && activePlaylistId.value) {
    const itemsInPlaylist = playlistItems.value.filter(item => item.playlistId === activePlaylistId.value)
    const videoIdOrderMap = new Map(itemsInPlaylist.map((item, index) => [item.videoId, index]))
    
    result = result.filter(v => videoIdOrderMap.has(v.id))
    result.sort((a, b) => videoIdOrderMap.get(a.id) - videoIdOrderMap.get(b.id))
    return result
  } else if (currentTab.value === 'discoverAll') {
    const subscribedIds = creators.value.map(c => c.id)
    result = result.filter(v => subscribedIds.includes(v.creatorId))
  } else if (currentTab.value === 'discoverHeart') {
    const favoriteCreatorIds = creators.value.filter(c => c.isFavorite).map(c => c.id)
    result = result.filter(v => favoriteCreatorIds.includes(v.creatorId))
  }

  if (searchQuery.value.trim() && !isSearchMode.value && !isMusicMode.value) {
    const query = searchQuery.value.trim().toLowerCase()
    result = result.filter(v => v.title.toLowerCase().includes(query) || v.creatorName.toLowerCase().includes(query))
  }

  if (!isPlaylistMode.value && !isTrendingMode.value && !isMusicMode.value) {
    result.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))
  }

  return result
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

.text-accent { color: #a78bfa !important; }
.icon-tab-group { background: rgba(0, 0, 0, 0.4) !important; border: 1px solid rgba(255, 255, 255, 0.1) !important; }
.search-bar { max-width: 100%; }
.search-bar .v-field { border-radius: 30px !important; background: rgba(0, 0, 0, 0.3) !important; color: white !important; font-size: 13px !important; }

.video-checkbox-wrapper { position: absolute; top: 6px; right: 6px; z-index: 4; }
.bg-dark-glass { background: rgba(0, 0, 0, 0.6) !important; backdrop-filter: blur(4px); border: 1px solid rgba(255, 255, 255, 0.2); }
.jump-box-container { background: rgba(0, 0, 0, 0.5) !important; border: 1px solid rgba(255, 255, 255, 0.1) !important; }

.custom-jump-input { width: 38px !important; }
.custom-jump-input .v-field { background: rgba(0, 0, 0, 0.6) !important; border-radius: 6px !important; color: white !important; height: 28px !important; padding: 0 2px !important; }
.custom-jump-input .v-field__input { padding: 0 !important; min-height: 28px !important; height: 28px !important; line-height: 28px !important; font-size: 11px !important; text-align: center !important; }

.custom-list-item { border-radius: 12px !important; margin-bottom: 4px; transition: all 0.3s ease; }
.custom-list-item:hover { background: rgba(255, 255, 255, 0.07) !important; }
.neon-active { background: linear-gradient(135deg, rgba(121, 40, 202, 0.4), rgba(0, 112, 243, 0.4)) !important; border: 1px solid rgba(167, 139, 250, 0.3) !important; }

.glass-card { transition: transform 0.3s ease, box-shadow 0.3s ease; cursor: pointer; }
.glass-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(121, 40, 202, 0.3) !important; border-color: rgba(167, 139, 250, 0.4) !important; }

.playlist-list-item { transition: background 0.2s ease; cursor: pointer; }
.playlist-list-item:hover { background: rgba(255, 255, 255, 0.07) !important; }
.video-duration-badge-small { position: absolute; bottom: 2px; right: 2px; background: rgba(0, 0, 0, 0.8); color: #fff; padding: 1px 3px; border-radius: 3px; font-size: 9px; font-weight: bold; z-index: 2; }

.video-thumb-img { height: 110px !important; }
@media (min-width: 600px) { .video-thumb-img { height: 150px !important; } }

.shorts-horizontal-scroll { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 8px; scrollbar-width: thin; scrollbar-color: rgba(255, 255, 255, 0.2) transparent; }
.shorts-horizontal-scroll::-webkit-scrollbar { height: 5px; }
.shorts-horizontal-scroll::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 3px; }

.shorts-card { width: 130px; min-width: 130px; }
@media (min-width: 600px) { .shorts-card { width: 160px; min-width: 160px; } }

.shorts-badge { position: absolute; top: 6px; left: 6px; background: rgba(255, 0, 0, 0.8); color: white; padding: 2px 5px; border-radius: 4px; font-size: 9px; font-weight: bold; }
.video-progress-bar-container { position: absolute; bottom: 0; left: 0; right: 0; height: 4px; background-color: rgba(255, 255, 255, 0.3); z-index: 3; }
.video-progress-bar-fill { height: 100%; background-color: #ff0000; transition: width 0.3s ease; }

.play-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.4); display: flex; justify-content: center; align-items: center; opacity: 0; transition: opacity 0.3s ease; }
.video-thumbnail-wrapper:hover .play-overlay, .shorts-thumbnail-wrapper:hover .play-overlay { opacity: 1; }

.video-duration-badge-left { position: absolute; bottom: 8px; left: 8px; background: rgba(0, 0, 0, 0.8); color: #fff; padding: 1px 5px; border-radius: 4px; font-size: 11px; font-weight: bold; z-index: 2; letter-spacing: 0.5px; }
.safe-player-dialog { margin: 4px !important; max-height: 98vh !important; }
@media (max-width: 600px) { .safe-player-dialog { margin: 0 !important; max-height: 100vh !important; } }

.main-content { overflow-y: auto !important; max-height: calc(100vh - 64px); }
.loading-overlay-container { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.65); backdrop-filter: blur(4px); z-index: 2000; display: flex; justify-content: center; align-items: center; }
.loading-card { border: 1px solid rgba(167, 139, 250, 0.3) !important; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8) !important; min-width: 220px; text-align: center; }

.modal-vertical-container { max-height: calc(88vh - 40px); overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(255, 255, 255, 0.2) transparent; }
.modal-vertical-container::-webkit-scrollbar { width: 6px; }
.modal-vertical-container::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 3px; }

.video-container { position: relative; width: 100%; aspect-ratio: 16 / 9; min-height: 160px; background: #000000; overflow: hidden; flex-shrink: 0; transition: all 0.3s ease; }
.video-container.landscape-expanded { aspect-ratio: 21 / 9; min-height: 280px; }
.video-container.audio-only-hidden { height: 0 !important; min-height: 0 !important; aspect-ratio: unset !important; opacity: 0; pointer-events: none; }

.radio-placeholder-card { background: rgba(121, 40, 202, 0.15); border-bottom: 1px solid rgba(167, 139, 250, 0.3); }
.pulse-icon { animation: pulse 2s infinite; }
@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.15); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
}

.youtube-iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; display: block; }

.comments-scroll-area, .related-scroll-area-long { max-height: 260px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(255, 255, 255, 0.2) transparent; padding-right: 24px; }
.related-scroll-area-long { max-height: 350px; }

.comments-scroll-area::-webkit-scrollbar, .related-scroll-area-long::-webkit-scrollbar { width: 4px; }
.comments-scroll-area::-webkit-scrollbar-thumb, .related-scroll-area-long::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 3px; }

.scroll-top-fab, .modal-scroll-top-fab, .main-scroll-top-fab { position: absolute; bottom: 12px; right: 12px; z-index: 5; box-shadow: 0 4px 10px rgba(0,0,0,0.5) !important; }
.modal-scroll-top-fab, .main-scroll-top-fab { position: sticky; float: right; margin-right: 20px; margin-bottom: 20px; z-index: 10; box-shadow: 0 4px 15px rgba(0,0,0,0.7) !important; }

.mobile-tight-header { min-height: 36px !important; }
.border-top-glass { border-top: 1px solid rgba(255, 255, 255, 0.08); background: rgba(0, 0, 0, 0.15); }
.border-bottom-glass { border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
.border-left-glass { border-left: 2px solid rgba(167, 139, 250, 0.3); }

.related-video-item, .comment-item { transition: background 0.2s ease; }
.related-video-item:hover { background: rgba(255, 255, 255, 0.07); }

.text-truncate-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.play-btn-circle { width: 52px; height: 52px; border-radius: 50%; background: rgba(167, 139, 250, 1); display: flex; justify-content: center; align-items: center; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5); transition: transform 0.2s ease, background-color 0.2s ease; }
.play-btn-circle:hover { transform: scale(1.1); background: #7c3aed; }
.shorts-play-btn { width: 40px; height: 40px; }

.comment-text-content a { color: #a78bfa !important; text-decoration: underline !important; font-weight: 500; }
.creator-author-badge { background: rgba(167, 139, 250, 0.25); color: #c4b5fd !important; padding: 1px 6px; border-radius: 10px; border: 1px solid rgba(167, 139, 250, 0.4); }
</style>