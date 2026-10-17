Set fso = CreateObject("Scripting.FileSystemObject")
Set WshShell = CreateObject("WScript.Shell")
folder = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = folder
WshShell.Run "cmd /c npm run serve", 0, False
