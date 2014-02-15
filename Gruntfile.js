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
      all: ["public/assets/js/custom.js"]
    },

    clean: {
      all: {
        src: ["public/assets/js/scripts.min.js"]
      }
    },

    less: {
      all: {
        options: {
          paths: ["public/assets/less", "public/assets/css", "public/register/assets/less", "public/register/assets/css"],
          compress: true
        },
        files: {
          "public/assets/css/style.css": "public/assets/less/style.less",
          "public/register/assets/css/style.css": "public/register/assets/less/style.less"
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
          'public/assets/js/scripts.min.js': [
              'public/assets/js/jquery.js'
            , 'public/assets/js/scrollit.js'
            , 'public/assets/js/waypoints.js'
            , 'public/assets/js/waypoints-sticky.js'
            , 'public/assets/js/tipr.js'
            , 'public/assets/js/custom.js'
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
        files: ['public/assets/js/custom.js'],
        tasks: ['dist-js']
      },
      stylesheets: {
        files: ['public/assets/less/*.less', 'public/register/assets/less/*.less'],
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

  // JS distribution task.
  grunt.registerTask('dist-js', ['clean', 'jshint', 'uglify']);

  // CSS distribution task.
  grunt.registerTask('dist-css', ['less']);

  // Full distribution task.
  grunt.registerTask('dist', ['dist-css', 'dist-js']);

  // Default task.
  grunt.registerTask('default', ['dist', 'watch']);
};
