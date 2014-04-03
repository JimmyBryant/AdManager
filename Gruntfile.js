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
					'public/js/instreet.couplet.min.js': ['public/js/src/instreet.couplet.js']
				}
			},
			popup:{
				files: {
					'public/js/instreet.popup.min.js': ['public/js/src/instreet.popup.js']
				}
			}
		},
		concat:{
			js:{
				src:['public/js/src/gpt.js','public/js/instreet.permanent.min.js'],
				dest:'public/js/instreet.permanent.min.js'
			}
		}	
	});

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-concat');

	grunt.registerTask('default',['jshint:js','uglify:js','concat:js']);
	grunt.registerTask('popup',['jshint:js','uglify:popup']);
}
