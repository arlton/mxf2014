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
      all: ["assets/js/custom.js"]
    },

    clean: {
      all: {
        src: ["assets/js/scripts.min.js"]
      }
    },

    less: {
      all: {
        options: {
          paths: ["assets/less", "assets/css"],
          compress: true
        },
        files: {
          "assets/css/style.css": "assets/less/style.less"
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
          'assets/js/scripts.min.js': [
              'assets/js/jquery.js'
            , 'assets/js/jquery.stellar.min.js'
            , 'assets/js/scrollit.js'
            , 'assets/js/headroom.min.js'
            , 'assets/js/jQuery.headroom.js'
            , 'assets/js/jquery.sticky-div.js'
            , 'assets/js/custom.js'
          ]
        }
      }
    },

    watch: {
      gruntfile: {
        files: ['Gruntfile.js'],
        tasks: ['recess', 'clean', 'jshint', 'uglify']
      },
      javascript: {
        files: ['assets/js/custom.js'],
        tasks: ['clean', 'uglify']
      },
      stylesheets: {
        files: ['assets/less/*.less'],
        tasks: ['recess']
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
  grunt.registerTask('default', ['dist']);
};