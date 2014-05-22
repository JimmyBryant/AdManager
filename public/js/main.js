define(function  (require,exports,module) {

	var $=jQuery=require('jquery');
	window.$ = $;
	var deleteSite = function(field,callback){	//delete site		
		var deleteAPI = '/site/delete';
		if(confirm('确定要删除该网站?')){
			$.post(deleteAPI,{field : field},callback);
		}		
	};

	var deleteWidget = function(field,callback){
		var deleteAPI = '/widget/delete';
		if(confirm('确定要删除该广告插件')){
			$.post(deleteAPI,{field : field},callback);
		}
	};

	var updateState = function(elem){
		var field=$(elem).attr('field'),
			alive=0;
		if($(elem).hasClass('disabled')){
			return false;
		}	

		if($(elem).hasClass('site-active')){
			alive=1;
			$(elem).addClass('disabled').text('激活中...');
		}else{
			$(elem).addClass('disabled').text('暂停中...');
		}	

		$.post('/site/updateState',{field : field,state : alive},function(result){
			if(result.err){

			}else{
				if(alive){	//widget has been actived
					$(elem).removeClass('site-active disabled').addClass('site-stop').text("暂停");
					$(elem).parent().prev().html('<span class="label label-success">已激活</span>');
				}else{
					$(elem).removeClass('site-stop disabled').addClass('site-active').text("激活");							
					$(elem).parent().prev().html('<span class="label">未激活</span>');
				}						
			}
		});
	};

	var main={			
		activeNav:function(){
			var href=location.href.replace(location.search,''),
				$userManager=$('#user-manager'),
				$globalNav=$('#nav-global'),
				$items=$('li',$userManager),
				$navs=$('li',$globalNav);
			for(var i=$navs.length;i--;){
				var elem=$navs[i];				
				if(elem.firstChild.href==href||elem.firstChild.href+'/'==href){				
					$(elem).addClass('active');
					break;
				}
			}	
			for(var i=$items.length;i--;){
				var elem=$items[i];					
				if(elem.firstChild.href==href||elem.firstChild.href+'/'==href){				
					$(elem).addClass('active');
					break;
				}
			}
		},
		bindAdEvents : function(validate){
			var $f=$('#widget-data-form');
			if($f.length){
				var $adTypeSl=$('#adType'),
					oAdType=$adTypeSl.val(),
					inputPubID=$('#pubID'),					
					inputSlot=$('#slot'),
					isCouplete = $('.ad-couplet').length;
					
				function addRequired(c){
					var idArr = [];
					c.find(":text[validate!='no']").each(function(index,elem){
						$(elem).attr('required',true);
						idArr.push('#'+elem.id);
					});					
					validate.addFields(idArr);					
				}
				function removeRequired(c){
					var idArr = [];
					c.find(":text").each(function(index,elem){
						$(elem).removeAttr('required',true);
						idArr.push('#'+elem.id);
					});						
					validate.removeFields(idArr);								
				}

				function changeAdType(){
					var adType = $adTypeSl.val(),
						googleBox=$('#ad-adsense'),
						dfpBox=$('#ad-dfp'),
						bannerBox=$('.ad-banner'),
						coupletBox=$('.ad-couplet');
					var  adDataBox = {
						dfp : dfpBox,
						adsense : googleBox,
						afv : googleBox,
						baidu : googleBox,
						banner : bannerBox
					};
					if(adType){
						if(isCouplete){
							var slots = coupletBox.find('.slot');
							if(adType=='baidu'){
								slots.hide();
								removeRequired(slots);								
							}else{
								slots.show();
								addRequired(slots);
							}
						}else{
							if(adType == 'banner'){
								$('#gsize').hide();
							}else{
								$('#gsize').show();
							}
							adDataBox[adType].show(function(){
								addRequired($(this));
								if(adType=='baidu'){
									var slot = $(this).children()[1];
									removeRequired($(slot));								
									$(slot).hide();
								}else{
									$(googleBox.children()[1]).show();
								}
							});
							adDataBox[adType].isShowing = true;
							for(var t in adDataBox){

								!adDataBox[t].isShowing&&adDataBox[t].hide(function(){
									removeRequired($(this));
								});	
								
							}					
						}						
					}
				}
				var gadValue={
					adsense:{
						pubID:'',
						slot:''
					},
					afv:{
						pubID:'',
						slot:''
					},
					banner:{
						pubID:'',
						slot:''
					},
					baidu:{
						pubID:''
					}
				};
				var coupletValue = {
					adsense : {
						pubID1 : '',
						pubID2 : '',
						slot1 : '',
						slot2 : ''
					},
					baidu : {
						pubID1 : '',
						pubID2 : ''
					},
					dfp : {
						pubID1 : '',
						pubID2 : '',
						slot1 : '',
						slot2 : ''
					}
				};
				$adTypeSl.click(function(){					
					if(this.value!=oAdType){
						if(isCouplete){
							for(var p in coupletValue[oAdType]){
								coupletValue[oAdType][p] = $('#'+p).val();								
							}
							for(var p in coupletValue[this.value]){
								$('#'+p).val(coupletValue[this.value][p]);
							}

						}else{
							if(oAdType!='dfp'){	//存储adsense,afv,baidu广告的pubID以及slot
								gadValue[oAdType]['pubID']=inputPubID.val();
								gadValue[oAdType]['slot']=inputSlot.val();
							}
							if(this.value!='dfp'){	//填充adsense,afv,baidu广告的pubID以及slot
								inputPubID.val(gadValue[this.value]['pubID']);
								inputSlot.val(gadValue[this.value]['slot']);
							}
						}												
						oAdType=this.value;					
						changeAdType();						
					}
				});		

				var valUnit = {
					adSize : '',
					pubID : '',
					slot : ''
				};

				$('#ad-setting .setting').click(function(){
					$('#ad-setting .setting').toggle();
					$('#ad-setting .setting-box').toggle();
				});

				$('.btn-custom-adSize').click(function(){
					$(this).hide();
					$('#custom-adSize').slideDown();
				});

				$('#custom-adSize .cancel').click(function(){	//cancel custom adsize
					$('#custom-adSize').slideUp(function(){
						$('.btn-custom-adSize').show();
						$('#custom-adSize').find(':text').val('');
					});					
				});

				$('#custom-adSize .ok').click(function(){	//add custom adsize
					var val = $.trim($(this).prev().val()),
						reg = /^[\d]+x[\d]+$/;
					if(val!=''&&reg.test(val)){
						$('#adSize').append($('<option selected>').val(val).text(val));
						$('#custom-adSize .cancel').trigger('click');
					}
				});

				if(oAdType != 'adsense')
					changeAdType();
			}
		},
		bindEvents : function(){
			require('bootstrap');

			$('.site-stop').click(function(){
				updateState(this);
			});
			$('.site-active').click(function(){
				updateState(this);
			});
			$('.site-delete').click(function(){
				var field = $(this).attr('field');				
				deleteSite(field,function(result){
					console.log(result);
					if(result.success){
						location.href = '/';
					}else{
						alert(result.err.toString());
					}
				});
			});
			$('.widget-delete').click(function(){
				var field = $(this).attr('field'),
					widget = $(this).parents('.widget-item:eq(0)');
				deleteWidget(field,function(result){
					if(result.success){
						widget.fadeOut();
					}
				});
			});
		},
		bindWidgetEvents : function(){
			require('zclip');
			$('#widget-code-modal').modal({	//init modal
				show : false
			}).on('shown',function(){				
				$('#widget-code-copy').zclip('remove').zclip({
					path : '/js/sea-modules/zclip/ZeroClipboard.swf',
					copy : function(){
						return  $('#copy-text').text();
					},
					afterCopy : function(){							
						$('#widget-code-copy').attr('data-original-title','复制成功').tooltip('show');
					}
				});
			});

			$('#widget-code-copy').on('mouseover',function(){$(this).attr('data-original-title','复制到剪贴板')}).tooltip();
		
			$('.widget-code').click(function(){	//get ad code
				var remote="/widget/code?field="+$(this).attr('data-field')+'&widgetType='+$(this).attr('data-type'),				      
				      title=$(this).parents('.widget-item:eq(0)').find('h5').text(),
				      textarea = $('#widget-code-modal .modal-body textarea');				 
				$('#widget-code-modal .modal-header h3').text(title);
				textarea.text();				
				$.get(remote,function(data){
					textarea.text(data);		
					$('#widget-code-modal').modal('show');			
				})				
			});
			$('.widget-more-action').on('click',function(e){
				var $btn = $(this);
				if($btn.hasClass('clicked')){
					$btn.removeClass('clicked');
					$btn.next().hide();
				}else{
					$btn.addClass('clicked');
					$btn.next().show();
				}
			});
			$(document).on('click',function(e){
				var tar = e.target
					,$tar = $(tar)
					;
				var isBtn = $tar.hasClass('clicked');				
				$('.widget-more-action').removeClass('clicked');
				$('.widget-hidden-action').hide();
				if(isBtn){
					$tar.addClass('clicked');
					$tar.next().show();
				}
			});			
		},
		bindLogEvents : function(){
			require('datepicker');
			var d = new Date();
			var dateOpt = {	
				language : 'zh-CN',			
				format : 'yyyy-mm-dd',
				weekStart : 1,
				endDate : [d.getFullYear(),d.getMonth()+1,d.getDate()].join('-')
			}
			$('.input-daterange').datepicker(dateOpt);	
		}
	}

	module.exports=main;
});