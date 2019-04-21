<template>
  <v-app>
    <v-toolbar dark color="primary" v-if="accessToken !== null">
      <v-toolbar-title>Allegro Summer e-Xperience</v-toolbar-title>
    </v-toolbar>
    <v-content>
      <v-container fluid fill-height v-if="accessToken === null">
        <v-layout align-center justify-center>
          <v-flex xs12 sm8 md4>
            <v-card class="elevation-12">
              <v-toolbar dark color="primary">
                <v-toolbar-title>Allegro Summer e-Xperience</v-toolbar-title>
              </v-toolbar>
              <v-card-text>
                Witaj w aplikacji stworzonej na potrzeby programu stażowego Allegro. Wykorzystuje ona Spotify API oraz Vue. Aby móc z niej skorzystać dokonaj autoryzacji za pomocą swojego konta Spotify.
              </v-card-text>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="primary" @click="logIn">Autoryzacja</v-btn>
              </v-card-actions>
            </v-card>
          </v-flex>
        </v-layout>
      </v-container>
      <v-container v-else>
        <v-layout row wrap>
          <template v-if="searchResults !== null">
            <v-flex xs12 sm5>
              <v-text-field label="Nazwa albumu" v-model="searchString" color="primary"/>
            </v-flex>
            <v-flex xs12 sm3 offset-sm1>
              <v-select v-model="sortingChosen" :items="sortingMethods" label="Sortowanie"/>
            </v-flex>
            <v-flex xs12 sm2 offset-sm1>
              <v-btn color="primary" @click="searchSpotify" block>Szukaj</v-btn>
            </v-flex>
          </template>
          <template v-else>
            <v-flex xs12 sm9>
              <v-text-field label="Nazwa albumu" v-model="searchString" color="primary"/>
            </v-flex>
            <v-flex xs12 sm2 offset-sm1>
              <v-btn color="primary" @click="searchSpotify" block>Szukaj</v-btn>
            </v-flex>
          </template>
          <v-flex xs12>
            <v-container fluid grid-list-md>
              <v-layout row wrap>
                <v-flex xs12 v-for="item in sortedResults" :key="item.id">
                  <album :album-data="item" :access-token="accessToken" @auth-refused="logIn"/>
                </v-flex>
              </v-layout>
            </v-container>
          </v-flex>
          <v-flex xs12>
            <v-btn color="primary" block @click="moreResults" v-if="moreResultsUrl !== null">
              Więcej wyników
            </v-btn>
          </v-flex>
        </v-layout>
      </v-container>
    </v-content>
  </v-app>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Album from './components/Album.vue';
import CLIENT_ID from './config';

@Component({
  components: {
    Album,
  },
})
export default class App extends Vue {
  private authorized: boolean = false;
  private authCode: string = '';

  private searchString: string = '';
  private searchResults: any[] | null = null;
  private moreResultsUrl: string | null = null;

  private sortingMethods: string[] = [
    'Brak',
    'Nazwa (rosnąco)',
    'Nazwa (malejąco)',
    'Data wydania (rosnąco)',
    'Data wydania (malejąco)',
  ];
  private sortingChosen: string = 'Brak';

  get redirectURI() {
    return `${location.protocol}//${location.host}${location.pathname}`;
  }

  private logIn() {
    const queryBuilder = new URLSearchParams();
    queryBuilder.append('client_id', CLIENT_ID);
    queryBuilder.append('redirect_uri', this.redirectURI);
    queryBuilder.append('response_type', 'token');
    queryBuilder.append('show_dialog', 'false');
    const queryString = queryBuilder.toString();

    const fullAddress = 'https://accounts.spotify.com/authorize?' + queryString;

    window.location.href = fullAddress;
  }

  get accessToken() {
    const hash = window.location.hash.substring(1).split('&').map((el) => {
      const dividedElement = el.split('=');
      return {
        parameter: dividedElement[0],
        value: dividedElement[1],
      };
    });
    const accessTokenObject = hash.find((el) => el.parameter === 'access_token');
    return typeof accessTokenObject !== 'undefined' ? accessTokenObject.value : null;
  }

  private searchSpotify() {
    const queryBuilder = new URLSearchParams();
    queryBuilder.append('q', this.searchString);
    queryBuilder.append('type', 'album');
    const queryString = queryBuilder.toString();

    const res = fetch('https://api.spotify.com/v1/search?' + queryString, {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + this.accessToken,
      },
    })
    .then((response) => {
      if (response.status === 200) {
        response.json().then((responseData) => {
          this.searchResults = responseData.albums.items;
          this.moreResultsUrl = responseData.albums.next;
        });
      } else if (response.status === 401) {
        this.logIn();
      }
    });
  }

  private moreResults() {
    if (this.moreResultsUrl !== null) {
      fetch(this.moreResultsUrl, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + this.accessToken,
        },
      })
      .then((response) => {
        if (response.status === 200) {
          response.json().then((responseData) => {
            this.searchResults!.push(...responseData.albums.items);
            this.moreResultsUrl = responseData.albums.next;
          });
        } else if (response.status === 401) {
          this.logIn();
        }
      });
    }
  }

  get sortedResults() {
    if (this.searchResults === null) {
      return null;
    } else {
      switch (this.sortingChosen) {
        case 'Brak': {
          return this.searchResults;
        }
        case 'Nazwa (rosnąco)': {
          return [...this.searchResults].sort((a, b) => a.name.localeCompare(b.name));
        }
        case 'Nazwa (malejąco)': {
          return [...this.searchResults].sort((a, b) => b.name.localeCompare(a.name));
        }
        case 'Data wydania (rosnąco)': {
          return [...this.searchResults].map((el) => {
            return {
              ...el,
              release_date: new Date(el.release_date),
            };
          }).sort((a, b) => a.release_date - b.release_date)
          .map((el) => {
            return {
              ...el,
              release_date: el.release_date.toISOString().slice(0, 10),
            };
          });
        }
        case 'Data wydania (malejąco)': {
          return [...this.searchResults].map((el) => {
            return {
              ...el,
              release_date: new Date(el.release_date),
            };
          })
          .sort((a, b) => b.release_date - a.release_date)
          .map((el) => {
            return {
              ...el,
              release_date: el.release_date.toISOString().slice(0, 10),
            };
          });
        }
        default: {
          return this.searchResults;
        }
      }
    }
  }
}
</script>
