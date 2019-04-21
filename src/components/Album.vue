<template>
  <v-flex xs12>
    <v-card>
      <v-layout>
        <v-flex xs5>
          <v-container fluid fill-height>
            <v-layout row wrap align-center>
              <v-flex>
                <v-img
                  :src="coverImageUrl"
                  max-height="150px"
                  contain
                ></v-img>
              </v-flex>
            </v-layout>
          </v-container>
        </v-flex>
        <v-flex xs7>
          <v-card-title primary-title>
            <div>
              <div class="headline">{{ albumName }}</div>
              <div>Autor: {{ artists }}</div>
              <div>Data wydania: {{ releaseDate }}</div>
              <div>Utworów: {{ totalTracks }}</div>
            </div>
          </v-card-title>
          <v-card-actions>
            <v-btn flat color="primary" @click="showAdditionalData">Szczegóły</v-btn>
          </v-card-actions>
        </v-flex>
      </v-layout>
      <v-slide-y-transition>
        <div v-show="showMore">
          <v-divider></v-divider>
          <v-card-text v-if="!fullDataFetched" class="text-xs-center">
            <v-progress-circular indeterminate color="primary" :size="50"/>
          </v-card-text>
          <v-card-text v-if="fullDataFetched" >
            <div>
              <div class="subheading">Popularność</div>
              <v-progress-linear v-model="popularity"></v-progress-linear>
            </div>
            <br>
            <div>
              <div class="subheading">Całkowity czas trwania</div>
              <div>{{ totalDuration }}</div>
            </div>
            <br>
            <div class="subheading">Utwory</div>
            <v-data-table dense hide-actions :headers="trackTableHeaders" :items="tracks">
              <template v-slot:items="props">
                <td>{{ props.item.name }}</td>
                <td>{{ readableDuration(props.item.duration) }}</td>
              </template>
            </v-data-table>
          </v-card-text>
        </div>
      </v-slide-y-transition>
    </v-card>
  </v-flex>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';

interface TrackDuration {
  hours: number;
  minutes: number;
  seconds: number;
}

interface TrackTableHeader {
  text: string;
  sortable: boolean;
}

@Component
export default class Album extends Vue {
  @Prop(Object)
  private readonly albumData!: any;
  @Prop(String)
  private readonly accessToken!: string;

  private showMore: boolean = false;
  private fullDataFetched: boolean = false;
  private fullData: any = {};
  private trackTableHeaders: TrackTableHeader[] = [
    {
      text: 'Nazwa',
      sortable: false,
    },
    {
      text: 'Długość',
      sortable: false,
    },
  ];

  get albumName() {
    return this.albumData.name;
  }

  get artists() {
    return this.albumData.artists.map((el: any) => el.name).join(', ');
  }

  get releaseDate() {
    return this.albumData.release_date;
  }

  get totalTracks() {
    return this.albumData.total_tracks;
  }

  get coverImageUrl() {
    return this.albumData.images.find((el: any) => el.width === 300).url;
  }

  get fullDataHref() {
    return this.albumData.href;
  }

  get popularity() {
    if (this.fullDataFetched) {
      return this.fullData.popularity;
    } else {
      return null;
    }
  }

  get tracks() {
    if (this.fullDataFetched) {
      return this.fullData.tracks.items.map((el: any) => ({
        id: el.id,
        name: el.name,
        durationMs: el.duration_ms,
        duration: this.parseDurationSeconds(el.duration_ms / 1000),
        preview: el.preview_url,
        fullHref: el.href,
      }));
    } else {
      return null;
    }
  }

  get totalDuration() {
    const duration = this.tracks
        .map((el: any) => el.durationMs)
        .reduce((partialSum: number, el: number) => partialSum += el);
    return this.readableDuration(this.parseDurationSeconds(duration / 1000));
  }

  private parseDurationSeconds(duration: number): TrackDuration {
    let hours = 0;
    let minutes = 0;
    let seconds = 0;

    while (duration >= 3600) {
      hours++;
      duration -= 3600;
    }

    while (duration >= 60) {
      minutes++;
      duration -= 60;
    }

    seconds = Math.ceil(duration);

    return {
      hours,
      minutes,
      seconds,
    };
  }

  private readableDuration(duration: TrackDuration) {
    const hoursText = duration.hours < 10 ? '0' + duration.hours : duration.hours;
    const minutesText = duration.minutes < 10 ? '0' + duration.minutes : duration.minutes;
    const secondsText = duration.seconds < 10 ? '0' + duration.seconds : duration.seconds;

    return hoursText + ':' + minutesText + ':' + secondsText;
  }

  private showAdditionalData() {
    this.showMore = !this.showMore;

    if (this.fullDataFetched === false) {
      const res = fetch(this.fullDataHref, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + this.accessToken,
        },
      })
      .then((response) => {
        if (response.status === 200) {
          response.json().then((responseData) => {
            this.fullData = responseData;
          }).then(() => this.fullDataFetched = true);
        } else if (response.status === 401) {
          this.$emit('auth-refused');
        }
      });
    }
  }
}
</script>
