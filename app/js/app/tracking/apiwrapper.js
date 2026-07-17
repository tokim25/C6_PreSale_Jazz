var _Debug = false;

// Define exception/error codes
var _NoError = 0;
var _GeneralException = 101;
var _ServerBusy = 102;
var _InvalidArgumentError = 201;
var _ElementCannotHaveChildren = 202;
var _ElementIsNotAnArray = 203;
var _NotInitialized = 301;
var _NotImplementedError = 401;
var _InvalidSetValue = 402;
var _ElementIsReadOnly = 403;
var _ElementIsWriteOnly = 404;
var _IncorrectDataType = 405;

// local variable definitions
var closure_bool = false;
var global_response;
var myInterval = null;
var myDelay = 500;
var result_obj = null;
var init_dtm = new Date();

var nFindAPITries = 0;
var maxTries = 500;

// local variable definitions
var apiHandle = null;
var extendedApiHandle = null;
var API = null;
var findAPITries = 0;
var findExtendedAPITries = 0;
var lmsInitialized = "false";


function LMSInitialize()
{
   var api = getAPIHandle();

   if (api == null)
   {
      alert("Unable to locate the LMS's API Implementation.\nLMSInitialize was not successful.");
      return false;
   }
   var initResult = api.LMSInitialize("");
   
   doAlert("LMSInitialize() -- initResult: "+initResult);

   if (initResult.toString() != "true")
   {
      var err = ErrorHandler();
   }
   else
   {
		lmsInitialized = initResult.toString();
   }

   return initResult.toString();
}

function LMSInitialized()
{
	doAlert("LMSInitialized(): "+lmsInitialized);
	return lmsInitialized;
}

function doAlert(msg)
{
	if(_Debug)
	{
		alert(msg);
	} else {
       console.log(':: LMS Message ==> ' + msg);
    }
	
}

function mSecsToCMIDuration(n) {
//Convert duration from milliseconds to 0000:00:00.00 format
	var hms = "";
	var dtm = new Date();	dtm.setTime(n);
	var h = "000" + Math.floor(n / 3600000);
	var m = "0" + dtm.getMinutes();
	var s = "0" + dtm.getSeconds();
	var cs = "0" + Math.round(dtm.getMilliseconds() / 10);
	hms = h.substr(h.length-4)+":"+m.substr(m.length-2)+":";
	hms += s.substr(s.length-2)+"."+cs.substr(cs.length-2);
	return hms
}

function reportSessionTime() {
	var dtm = new Date();
	var n = dtm.getTime() - init_dtm.getTime();
	LMSSetValue("cmi.core.session_time",mSecsToCMIDuration(n));
}

/******************************************************************************************
**
** Function LMSFinish()
** Inputs:	None
** Return:	None
**
** Description:
** Close communication with LMS by calling the LMSFinish
** function which will be implemented by the LMS, if the LMS is
** compliant with the SCORM.
**
******************************************************************************************/
function LMSFinish()
{
   // wait for confirmation on successful LMSCommit and LMSFinish before closing
   if (closure_bool == false) {
	  reportSessionTime();
      result_obj = LMSCommit();
      myInterval = setInterval("checkCommit()", myDelay);
      return;
   }
}

//function added to address LMS's (like SumTotal) which require a call to extendedApiHandle.exit() in order to close the course window

function LMSFinishWinClosure()
{
	doAlert("LMSFinishWinClosure()");
   if (closure_bool == false) {
	  reportSessionTime();
      LMSCommit();
      var api = getAPIHandle();
      var extendedApiHandle = getExtendedAPIHandle();
   	   
      if (extendedApiHandle != null) {
         extendedApiHandle.exit();
      }
      if (api == null) {
         alert("Unable to locate the LMS's API Implementation.\nLMSFinish was not successful.");
      } else {
         api.LMSFinish('');
         closure_bool = true;
         return;
      }
   }
}

function checkCommit()
{
   // check for successful commit, then call LMSFinish checker
   global_response = result_obj.toString();
   if (global_response == "true") {
      // commit was successful
      var api = getAPIHandle();
      var extendedApiHandle = getExtendedAPIHandle();

      if (extendedApiHandle != null) {
         clearInterval(myInterval);
		 //kludge for SumTotal??
         extendedApiHandle.SetNavCommand("exit");
		 //extendedApiHandle.exit();
      }
      if (api == null) {
            alert("Unable to locate the LMS's API Implementation.\nLMSFinish was not successful.");
        } else {
            clearInterval(myInterval);
            result_obj = api.LMSFinish('');
            var err = ErrorHandler(true, "Good LMSCommit, called LMSFinish");
            myInterval = setInterval("checkFinish()", myDelay);
      }
   } else {
      // commit was not succesful
      var err = ErrorHandler(true, "Checking LMSCommit Response");
   }
}

function checkFinish()
{
   // check for successful LMSFinish, then close window
   global_response = result_obj.toString();
   if (global_response == "true") {
      clearInterval(myInterval);
	  top.close();
      closure_bool = true;
   } else {
      alert("no finish yet");
   }
}
/******************************************************************************************
**
** Function LMSGetValue(name)
** Inputs:	name - string representing the cmi data model defined category or
**				   element (e.g. cmi.core.student_id)
** Return:	The value presently assigned by the LMS to the cmi data model
**			element defined by the element or category identified by the name
**			input value.
**
** Description:
** Wraps the call to the LMS LMSGetValue method
**
******************************************************************************************/
function LMSGetValue(name)
{
   var api = getAPIHandle();
   if (api == null)
   {
      alert("Unable to locate the LMS's API Implementation.\nLMSGetValue was not successful.");
      return null;
   }
   else
   {
      //alert("getting " + name);
      var value = api.LMSGetValue(name);
	  doAlert("[apiwrapper] LMSGetValue("+name+"): " + value.toString());
      var err = ErrorHandler();
      // if an error was encountered, then return null,
      // else return the retrieved value
      if (err != _NoError)
      {
         return null;
      }
      else
      {
        // alert("returning: " + value.toString());	  
		 //sendValueToFlash(value.toString());
         return value.toString();
      }
   }
}

/******************************************************************************************
**
** Function LMSSetValue(name, value)
** Inputs:	name - string representing the cmi data model defined category or element
**			value - the value that the named element or category will be assigned
** Return:	None
**
** Description:
** Wraps the call to the LMS LMSSetValue method
**
******************************************************************************************/
function LMSSetValue(name, value)
{
   var api = getAPIHandle(),
       result;
   if (api == null)
   {
      alert("Unable to locate the LMS's API Implementation.\nLMSSetValue was not successful.");
   }
   else
   {
      result = api.LMSSetValue(name, value);
      var err = ErrorHandler();
   }

   return result;
}

/******************************************************************************************
**
** Function LMSCommit()
** Inputs:	None
** Return:	None
**
** Description:
** Call the LMSCommit function which will be implemented by the LMS,
** if the LMS is compliant with the SCORM.
**
******************************************************************************************/
function LMSCommit()
{
   var api = getAPIHandle();
   if (api == null)
   {
      alert("Unable to locate the LMS's API Implementation.\nLMSCommit was not successful.");
   }
   else
   {
      // call the LMSInitialize function that should be implemented by the API
      var emptyString = new String("");
      var myResponse = api.LMSCommit('');
      var err = ErrorHandler();
   }

   return myResponse;

}

/******************************************************************************************
**
** Function LMSGetLastError()
** Inputs:	None
** Return:	The error code (integer format) that was set by the last LMS function call
**
** Description:
** Call the LMSGetLastError function which will be implemented by the LMS,
** if the LMS is compliant with the SCORM.
**
******************************************************************************************/
function LMSGetLastError()
{
   var api = getAPIHandle();
   if (api == null)
   {
      alert("Unable to locate the LMS's API Implementation.\nLMSGetLastError was not successful.");
      //since we can't get the error code from the LMS, return a general error
      return _GeneralError;
   }


   return api.LMSGetLastError().toString();

}

/******************************************************************************************
**
** Function LMSGetErrorString(errorCode)
** Inputs:	errorCode - Error Code(integer format)
** Return:	The textual description that corresponds to the input error code
**
** Description:
** Call the LMSGetErrorString function which will be implemented by the LMS,
** if the LMS is compliant with the SCORM.
**
******************************************************************************************/
function LMSGetErrorString(errorCode)
{
   var api = getAPIHandle();
   if (api == null)
   {
      alert("Unable to locate the LMS's API Implementation.\nLMSGetErrorString was not successful.");
   }

   return api.LMSGetErrorString(errorCode).toString();

}

/******************************************************************************************
**
** Function LMSGetDiagnostic(errorCode)
** Inputs:	errorCode - Error Code(integer format), or null
** Return:	The vendor specific textual description that corresponds to the input error code
**
** Description:
** Call the LMSGetDiagnostic function which will be implemented by the LMS,
** if the LMS is compliant with the SCORM.
**
******************************************************************************************/
function LMSGetDiagnostic(errorCode)
{
   var api = getAPIHandle();
   if (api == null)
   {
      alert("Unable to locate the LMS's API Implementation.\nLMSGetDiagnostic was not successful.");
   }

   return api.LMSGetDiagnostic(errorCode).toString();

}

/*******************************************************************************
**
** Function LMSIsInitialized()
** Inputs:	none
** Return:	true if the LMS API is currently initialized, otherwise false
**
** Description:
** Determines if the LMS API is currently initialized or not.
**
*******************************************************************************/
function LMSIsInitialized()
{
   // there is no direct method for determining if the LMS API is initialized
   // for example an LMSIsInitialized function defined on the API so we'll try
   // a simple LMSGetValue and trap for the LMS Not Initialized Error

   var api = getAPIHandle();
   if (api == null)
   {
      alert("Unable to locate the LMS's API Implementation.\nLMSIsInitialized() failed.");
      // no choice but to return false.
      return false;
   }
   else
   {
      var value = api.LMSGetValue("cmi.core.student_name");
      var errCode = api.LMSGetLastError().toString();
      if (errCode == _NotInitialized)
      {
         return false;
      }
      else
      {
         return true;
      }
   }
}

/******************************************************************************************
** APIWrapper Private function implementations
** Note: This is javascript so there is no way to really prevent someone
**	   from calling the other methods in this file, but they are really
**	   intended to be private methods.  Only the methods above
**       are intended to be called directly by the learning
**       content components.
******************************************************************************************/

/******************************************************************************************
**
** Function ErrorHandler()
** Inputs:	None
** Return:	The current value of the LMS Error Code
**
** Description:
** Determines if an error was encountered by the previous API call
** and if so, displays a message to the user.  If the error code
** has associated text it is displayed.
**
** Side Effects: Displays an alert window with the appropriate error information
**
******************************************************************************************/
function ErrorHandler()
{
   var api = getAPIHandle();
   if (api == null)
   {
      alert("Unable to locate the LMS's API Implementation.\nCannot determine LMS error code.");
      return;
   }

   // check for errors caused by or from the LMS
   var errCode = api.LMSGetLastError().toString();
   if (errCode != _NoError)
   {
      // an error was encountered so display the error description
      var errDescription = api.LMSGetErrorString(errCode);

      if (_Debug)
      {
         errDescription += "\n";
         errDescription += api.LMSGetDiagnostic(null);
         // by passing null to LMSGetDiagnostic, we get any available diagnostics
         // on the previous error.
      
      } else {
            console.log(':: LMS ERROR ==> ' + errDescription);
      }
      if (_Debug) alert(errDescription);
    
   }

   return errCode;
}

/******************************************************************************************
**
** Function getAPIHandle()
** Inputs:	None
** Return:	value contained by APIHandle
**
** Description:
** Returns the handle to API object if it was previously set,
** otherwise it returns null
**
******************************************************************************************/
function getAPIHandle()
{
   if (apiHandle == null)
   {
       apiHandle = getAPI();
   }
   return apiHandle;
}
function getExtendedAPIHandle()
{
   if (extendedApiHandle == null)
   {
       extendedApiHandle = getExtendedAPI();
   }
   return extendedApiHandle;
}

/******************************************************************************************
**
** Function findAPI(win)
** Inputs:	win - a Window Object
** Return:	If an API object is found, it is returned, otherwise null is returned.
**
** Description:
** This function looks for an object named API in the supported window hierarchy,
**
******************************************************************************************/
function findAPI(win)
{
   while ((win.API == null) && (win.parent != null) && (win.parent != win))
   {
      findAPITries++;
      // Note: 7 is an arbitrary number, but should be more than sufficient
      if (findAPITries > 7) 
      {
         alert("Error finding API -- too deeply nested.");
         return null;
      }
      
      win = win.parent;

   }
   return win.API;
}

function findExtendedAPI(win)
{
   while ((win.API_Extended == null) && (win.parent != null) && (win.parent != win))
   {
      findExtendedAPITries++;
      // Note: 7 is an arbitrary number, but should be more than sufficient
      if (findExtendedAPITries > 7) 
      {
         return null;
      }
      
      win = win.parent;

   }
   return win.API_Extended;
}

/******************************************************************************************
**
** Function getAPI()
** Inputs:	none
** Return:	If an API object is found, it is returned, otherwise null is returned.
**
** Description:
** This function looks for an object named API, first in the current window's hierarchy,
**  and then, if necessary, in the current window's opener window hierarchy (if there is
**  an opener window).
******************************************************************************************/

function getAPI()
{
   var theAPI = findAPI(window);
   if ((theAPI == null) && (window.opener != null) && (typeof(window.opener) != "undefined"))
   {
      theAPI = findAPI(window.opener);
   }
   if (theAPI == null)
   {
      alert("Unable to find an API adapter");
   }
   return theAPI;
}
function getExtendedAPI()
{
   var theExtendedAPI = findExtendedAPI(window);
   if ((theExtendedAPI == null) && (window.opener != null) && (typeof(window.opener) != "undefined"))
   {
      theExtendedAPI = findExtendedAPI(window.opener);
   }
   // no need to alert on no extended API

   return theExtendedAPI;
}
