var careerism = {	current_topic: 0,	current_grade: 0,	init: function() {		this.bindEvent();		this.webSocket();	},	 // 连接服务端	webSocket: function() {	   // 创建websocket	   // ws = new WebSocket("ws://192.168.1.10:7272");	   ws = new WebSocket("ws://118.25.35.75:9502");	   // 当socket连接打开时，输入用户名	   ws.onopen = onopen;	   // 当有消息时根据消息类型显示不同信息	   ws.onmessage = onmessage; 	   ws.onclose = function() {		  console.log("连接关闭，定时重连");	   };	   ws.onerror = function() {		  console.log("出现错误");	   };	},	initTopic: function () {		var self = this;		self.loadTopic(1);	},	loadTopic: function (data) {		var self = this;		var n = data['q_id'];		var options = data['options'];		// console.log(options);		var question = data['question'];		// console.log(question);		$('#curr_no').html(n);		$('#topic_title').html(question);		var option_html = '';		for(var id in options){			// console.log(id);			option_html += '<tr><td class="option_item" option_index="' + id + '" option_value="' + options[id] + '"  question_index="' + n +'">' + options[id] + '<i></i></td><tr>';		}		$('#topic_option').html(option_html);		setTimer();	},	loadOver: function () {				var self = this;		var grade = self.current_grade;		var res = 100 - Number(grade);		var show_data;		var fanal_data;		if(90 <= res && res <= 100){			show_data = self.res[0];		}else if(80 <= res && res < 90){			show_data = self.res[1];		}else if(70 <= res && res < 80){			show_data = self.res[2];		}else{			show_data = self.res[3];		}		var ran = Math.random() * 3 + 1;		if(ran < 2){			fanal_data = show_data[0];		}else if(ran >= 3){			fanal_data = show_data[2];		}else{			fanal_data = show_data[1];		}		var key_word = fanal_data.split('|')[0];		var detail = fanal_data.split('|')[1];		$('.grade_detail').html(res);		$('.des_keyword').html(key_word);		$('.des_detail').html(detail);	},	bindEvent: function () {		var self = this;		$('.wrap').on('click','.enter_btn',function () {			var type = "start";			var data = '{"type":"'+ type +'"}';			ws.send(data);			$('.enter_wrap').css('display','none');			$('.topic_wrap').css('display','block');			// self.initTopic();		});		$('.wrap').on('click','.option_item', function () {			var _this = $(this);			// var value = Number(_this.attr('option_value')); 			// self.current_grade = self.current_grade + value;			_this.addClass('select');			// _this.addClass('right-btn');			var type = 'answer';			var question = Number(_this.attr('question_index'));  // 第几题			var options = Number(_this.attr('option_index')); // 选项			var data = '{"type":"'+ type + '","q_id":"'+ question +'","options":"'+ options +'"}';			console.log(data);			ws.send(data);		});		$('.wrap').on('click','.over_share',function () {			var grade = self.current_grade;			var res = 100 - Number(grade);			$('.share_wrap').css('display','block');			document.title = '注意！有个智商指数达'+ res +'分的超人潜藏在你的朋友圈';		})	}}// 连接建立时发送登录信息function onopen(){	// 登录	var login_data = '{"type":"login"}';	//var login_data = '{"type":"logintest","room_id":2}';	console.log("websocket握手成功，发送登录数据:"+login_data);	ws.send(login_data);}// 服务端发来消息处理function onmessage(e){	console.log(e.data);	var data = eval("("+e.data+")");	switch(data['type']){		case 'question':			careerism.loadTopic(data);			break;		case 'right':			var option = '[option_index="'+ data['option'] +'"]';			$(option).addClass('right-btn');			setTimeout(function(){careerism.loadTopic(data)},1300);			break;		case 'wrong':			var option = '[option_index="'+ data['option'] +'"]';			$(option).addClass('error-btn');			wrongWindow();			break;		case 'over':			var option = '[option_index="'+ data['option'] +'"]';			$(option).addClass('right-btn');			overWindow();			break;		case 'timer':			timeWindow();			break;	}}// 重置倒计时function setTimer(){	clearInterval(timer);    $("#countdown3").empty();	$('#countdown3').ClassyCountdown({        end: '11',        now: '0',        labels: true,        style: {            element: "",            textResponsive: .5,            seconds: {                gauge: {                    thickness: .2,                    bgColor: "rgba(255,255,255,0.2)",                    fgColor: "rgb(241, 196, 15)"                },            }        }    });}function wrongWindow(){	x0p({	    title: '回答错误',	    text: '你个菜鸡还要重来吗？',	    animationType: 'slideUp',	    icon: 'custom',	    iconURL: 'images/1.jpg',	    buttons: [	        {	            type: 'info',	            text: '重来'	        },	        {	            type: 'cancel',	            text: '放弃'	        }	    ]	},function(button) {		if(button == 'info'){			console.log("yes");			var type = "start";			var data = '{"type":"'+ type +'"}';			ws.send(data);		}else if(button == 'cancel'){			console.log("no");			clearInterval(timer);			$('.enter_wrap').css('display','block');			$('.topic_wrap').css('display','none');		}	});}function timeWindow(){	x0p({	    title: '时间到',	    // text: '真能磨叽',	    animationType: 'slideUp',	    icon: 'custom',	    iconURL: 'images/3.gif',	    buttons: [	        {	            type: 'info',	            text: '重来'	        },	        {	            type: 'cancel',	            text: '放弃'	        }	    ]	},function(button) {		if(button == 'info'){			console.log("yes");			var type = "start";			var data = '{"type":"'+ type +'"}';			ws.send(data);		}else if(button == 'cancel'){			console.log("no");			// clearInterval(timer);			$('.enter_wrap').css('display','block');			$('.topic_wrap').css('display','none');		}	});}function overWindow(){	x0p({	    title: '都答对了',	    text: '百度的还挺快嘛',	    animationType: 'slideUp',	    icon: 'custom',	    iconURL: 'images/2.gif',	    buttons: [	        {	            type: 'info',	            text: '返回'	        }	    ]	},function(button) {		clearInterval(timer);		$('.enter_wrap').css('display','block');		$('.topic_wrap').css('display','none');	});}