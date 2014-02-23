/* jshint node: true */

module.exports = function(grunt) {
  "use strict";

  // Project configuration.
  grunt.initConfig({

    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/**\n' +
              '* <%= pkg.name %>.js v<%= pkg.version %>\n' +
              '* Copyright <%= grunt.template.today("yyyy") %> <%= pkg.author %>\n' +
              '* <%= _.pluck(pkg.licenses, "url").join(", ") %>\n' +
              '*/\n',

    // Task configuration.
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        browser: true,
        laxcomma: true,
        globals: {
          console: true,
          define: true
        }
      },
      all: ["public/assets/js/home.js", "public/assets/js/register.js"]
    },

    clean: {
      all: {
        src: ["public/assets/js/home.min.js", "public/assets/js/register.mins.js"]
      }
    },

    less: {
      all: {
        options: {
          paths: ["bower_components", "public/assets/less", "public/assets/css"],
          compress: true
        },
        files: {
          "public/assets/css/home.css": "public/assets/less/home/home.less",
          "public/assets/css/register.css": "public/assets/less/register/register.less"
        }
      }
    },

    handlebars: {
      compile: {
        options: {
          namespace: "HBS",
          partialRegex: /.*/,
          partialsPathRegex: /views\/partials\//
        },
        files: {
          "public/assets/js/templates.js": "views/**/*.hbs"
        }
      }
    },

    uglify: {
      options: {
        compress: true,
        mangle: false
      },
      all: {
        files: {
          'public/assets/js/home.min.js': [
              'bower_components/jquery/dist/jquery.js'
            , 'public/assets/js/scrollit.js'
            , 'public/assets/js/waypoints.js'
            , 'public/assets/js/waypoints-sticky.js'
            , 'public/assets/js/tipr.js'
            , 'public/assets/js/home.js'
          ],
          'public/assets/js/register.min.js': [
              'bower_components/jquery/dist/jquery.js'
            , 'bower_components/handlebars/handlebars.js'
            , 'bower_components/momentjs/moment.js'
            , 'bower_components/ladda/js/spin.js'
            , 'bower_components/ladda/js/ladda.js'
            , 'public/assets/js/parsley.js'
            , 'public/assets/js/templates.js'
            , 'public/assets/js/register.js'
          ]
        }
      }
    },

    watch: {
      gruntfile: {
        files: ['Gruntfile.js'],
        tasks: ['less', 'uglify']
      },
      javascript: {
        files: ['views/**/*.hbs', 'public/assets/js/home.js', 'public/assets/js/register.js'],
        tasks: ['dist-js']
      },
      stylesheets: {
        files: ['public/assets/less/**/*.less'],
        tasks: ['dist-css']
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-handlebars');

  // JS distribution task.
  grunt.registerTask('dist-js', ['clean', 'jshint', 'handlebars', 'uglify']);

  // CSS distribution task.
  grunt.registerTask('dist-css', ['less']);

  // Full distribution task.
  grunt.registerTask('dist', ['dist-css', 'dist-js']);

  // Default task.
  grunt.registerTask('default', ['dist', 'watch']);
};
