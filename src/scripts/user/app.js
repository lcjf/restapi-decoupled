// Strict Mode is a new feature in ECMAScript 5 that allows you to place a program, or a function, in a "strict" operating context.
// This strict context prevents certain actions from being taken and throws more exceptions.
// And:

// Strict mode helps out in a couple ways:

// It catches some common coding bloopers, throwing exceptions.
// It prevents, or throws errors, when relatively "unsafe" actions are taken (such as gaining access to the global object).
// It disables features that are confusing or poorly thought out.

// When the below is set to true, the comment below enables use strict globally

/*jshint strict: false */

(function() {
    'use strict';

    var App = Vue.extend();
    var postList = Vue.extend({
        template: '#post-list-template',
        data: function() {
            return {
                posts: '',
                nameFilter: '',
                categoryFilter: '',
                categories: '',
                filterActive: false,
                post: '',
                show: false
            };
        },
        ready: function() {
            var posts = this.$resource('http://restapi.li1.home-trial.com/wp-json/wp/v2/posts?per_page=20'),
                categories = this.$resource('http://restapi.li1.home-trial.com/wp-json/wp/v2/categories');

            posts.get(function(posts) {
                this.$set('posts', posts);
            });

            categories.get(function(categories) {
                this.$set('categories', categories);
            });
        },
        methods: {
            getThePost: function(id) {
                var posts = this.posts;

                this.$set('show', true);

                function filterPosts(el) {
                    return el.id == id;
                }

                this.$set('post', posts.filter(filterPosts));
            },
            filterVisibility: function() {
                if (this.filterActive) {
                    this.$set('filterActive', false);
                } else {
                    this.$set('filterActive', true);
                }
            },
            closePost: function() {
                this.$set('show', false);
            }
        }
    });

    var singlePost = Vue.extend({
        template: '#single-post-template',
        route: {
            data: function() {
                this.$http.get('http://restapi.li1.home-trial.com/wp-json/wp/v2/posts/?filter[name]=' + this.$route.params.postSlug, function(post) {
                    console.log("this.$route.params.postSlug", this.$route.params.postSlug);
                    this.$set('post', post);
                })
            }
        }
    });



    var router = new VueRouter({
        history: true
    });

    router.map({
        '/': {
            component: postList,
        },
        ':postSlug': {
            name: 'post',
            component: singlePost
        }
    });

    router.start(App, '#app');

}());
