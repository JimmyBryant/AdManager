  seajs.config({
    base: "/js/sea-modules/",
    alias: {
      "jquery": "jquery/jquery/1.10.1/jquery.js",
      "validate":"simple-validate.js",
      'easyform':'jquery.easyform.min.js',
      "bootstrap":"bootstrap.min.js",
      "zclip" : "zclip/jquery.zclip.min.js",
      'datepicker' : 'bootstrap.datepicker.min.js'
    },
    preload:['jquery']
  });

