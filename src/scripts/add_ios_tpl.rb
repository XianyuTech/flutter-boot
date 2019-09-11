require 'xcodeproj'

# path_to_project = ARGV[0]

# project = Xcodeproj::Project.open(path_to_project)
# main_target = project.targets.first

# phase = main_target.new_shell_script_build_phase("Flutter Build Script")

# #Remove the new phase from the end of array.
# main_target.build_phases.delete(phase)

# #Insert the phase into the array at index 0.
# main_target.build_phases.insert(0,phase)

# phase.shell_script = "\"$FLUTTER_ROOT/packages/flutter_tools/bin/xcode_backend.sh\" build \n\"$FLUTTER_ROOT/packages/flutter_tools/bin/xcode_backend.sh\" embed"
# project.save()


print "adding tpl ...\n"
xcodeproj_path = ARGV[0]
project_name = File.basename(xcodeproj_path, ".xcodeproj")
project_path = File.dirname(xcodeproj_path)
print "get project name:" + project_name + "\n"
file_dir_path = ARGV[1]

def addFilesToGroup(aTarget, aGroup)
    Dir.foreach(aGroup.real_path) do |entry|
        next if entry == '.' or entry == '..' or entry == '.DS_Store'
        filePath = File.join(aGroup.real_path, entry)
        print filePath+"\n"
        # 过滤目录和.DS_Store文件
        if !File.directory?(filePath) && entry != ".DS_Store" then
            # 向group中增加文件引用
            fileReference = aGroup.new_reference(filePath)
            if filePath.to_s.end_with?(".m", ".mm") then
                aTarget.source_build_phase.add_file_reference(fileReference, true)
            elsif filePath.to_s.end_with?(".plist") then
                aTarget.resources_build_phase.add_file_reference(fileReference, true)
            end
        elsif File.directory?(filePath) then
            subGroup = aGroup.find_subpath(File.basename(filePath), true)
            subGroup.set_source_tree('<group>')
            subGroup.set_path(filePath)
            addFilesToGroup(aTarget, subGroup)
        end
    end
end
project = Xcodeproj::Project.open(xcodeproj_path)
target = project.targets.first

group_subpath = file_dir_path.sub project_path+File::SEPARATOR, ""
print "get group subpath:" + group_subpath + "\n"
group = project.main_group.find_subpath(group_subpath, true)
group.set_source_tree('<group>')
group.set_path(file_dir_path)
addFilesToGroup(target, group)


# group.set_source_tree('SOURCE_ROOT')
# file_ref = group.new_reference(file_path)
# target.add_file_references([file_ref])
project.save
print "add tpl finished\n"


