require 'xcodeproj'

path_to_project = ARGV[0]

project = Xcodeproj::Project.open(path_to_project)
main_target = project.targets.first

phase = main_target.new_shell_script_build_phase("Flutter Build Script")

#Remove the new phase from the end of array.
main_target.build_phases.delete(phase)

#Insert the phase into the array at index 0.
main_target.build_phases.insert(0,phase)

phase.shell_script = "\"$FLUTTER_ROOT/packages/flutter_tools/bin/xcode_backend.sh\" build \n\"$FLUTTER_ROOT/packages/flutter_tools/bin/xcode_backend.sh\" embed"
project.save()



