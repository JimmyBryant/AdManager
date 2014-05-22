module.exports = function(grunt){
	grunt.initConfig({
		jshint : {
			options : {
				immed:true,
				laxbreak:true,
				browser:true,
				evil:true,
				laxcomma:true,
				scripturl:true,
				expr:true
			},
			js:['public/js/src/instreet.*.js']
		},
		uglify: {
			options: {
				banner: '/*!<%= grunt.template.today("yyyy-mm-dd") %> */\n'
			},
			js:{
				files: {
					'public/js/instreet.popup.min.js': ['public/js/src/instreet.popup.js'],
					'public/js/instreet.permanent.min.js': ['public/js/src/instreet.permanent.js'],
					'public/js/instreet.couplet.min.js': ['public/js/src/instreet.couplet.js'],
					'public/js/instreet.banner.min.js': ['public/js/src/instreet.banner.js']
				}
			},
			popup:{
				files: {
					'public/js/instreet.popup.min.js': ['public/js/src/instreet.popup.js']
				}
			},
			permanent:{
				files: {
					'public/js/instreet.permanent.min.js': ['public/js/src/instreet.permanent.js']
				}
			},
			banner:{
				files: {
					'public/js/instreet.banner.min.js': ['public/js/src/instreet.banner.js']
				}
			}
		},
		concat:{
			js:{
				src:['public/js/src/gpt.js','public/js/instreet.permanent.min.js'],
				dest:'public/js/instreet.permanent.min.js'
			}
		},
		less: {
			dev:{
				files:{
					'public/css/style.css':'public/css/style.less'
				}				
			}
		},
		watch: {
			css:{
				files:['public/css/*.less'],
				tasks:['less']
			}
		}	
	});

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('default',['jshint:js','uglify:js']);
	grunt.registerTask('popup',['jshint:js','uglify:popup']);
	grunt.registerTask('banner',['jshint:js','uglify:banner']);
	grunt.registerTask('permanent',['jshint:js','uglify:permanent','concat']);
}
